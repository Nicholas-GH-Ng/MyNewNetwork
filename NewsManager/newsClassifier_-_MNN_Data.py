#!/usr/bin/env python
# coding: utf-8
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

from bs4 import BeautifulSoup
import requests
import pandas as pd
import copy
from datetime import datetime, date, time, timezone

import pickle
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import punkt
from nltk.corpus.reader import wordnet
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
import requests
import numpy as np
import re

import time
import random

#%% Import spacy for nlp
import spacy
nlp = spacy.load('en_core_web_sm')


#Gets authentication and initialises if no app is running
if not firebase_admin._apps:
    cred = credentials.Certificate("./serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    print("No firebase app running")

db = firestore.client()

#pull and store from database
dataNews = []

docs = db.collection(u'NewsArticleData').stream()

# fill array with database news
for doc in docs:
    dataNews.append(doc.to_dict())

while True:
    #pull RSS feed
    topnews_url = 'https://news.google.com/rss'
    
    response = requests.get(topnews_url)
    soup = BeautifulSoup(response.content, features = 'xml')
    
    items = soup.find_all('item')
    
    newsItems = []
    
    
    #update RSS into news
    for item in items:
        newsItem = {}
        newsItem['title'] = item.title.text
        newsItem['link'] = item.link.text
        
        entities = []
        entities = [(ent.text, ent.label_) for ent in nlp (item.title.text).ents]
        s = ""
        for ent in entities:
            s = s+', '.join(ent) + " "
        
        newsItem['entities'] = s
        newsItem['source'] = item.source.text
        newsItem['publishedDate'] = datetime.strptime(item.pubDate.text, "%a, %d %b %Y %H:%M:%S %Z")
        
        view = int(random.randint(1, 3000)*random.randint(1, 5)*random.randint(5, 30)/random.randint(7, 11))
        like = int(view /random.randint(6, 10)*random.randint(5, 30)/random.randint(5, 30))
        dislike = int(view /random.randint(20, 50)*random.randint(5, 30)/random.randint(5, 30)/random.randint(5, 30))
        newsItem['views'] =view
        newsItem['likes'] = like
        newsItem['dislikes'] = dislike
        
        words = []
        
        for word in item.title.text.lower().split():
            words.append(word)
        
        newsItem['titleWords'] = words
        
    
        newsCheck = False
        
        for doc in dataNews:
            if(newsItem['title'] == doc['title']):
                newsCheck = True
                #print(newsItem['title'] + " Found FALSE");
    
        if(newsCheck == False):
            newsItems.append(newsItem)
        
    
    
    if newsItems:
        dataDF = pd.DataFrame(newsItems)
        
        # # Import Models
        # ## 1.1 Trained model
        # We are using the SVM Model for classifying
        path_svm = "./best_svc.pickle"
        
        with open(path_svm, 'rb') as data:
            svc_model = pickle.load(data)
        
        
        # In[9]:
        
        
        #TF-IDF object
        path_tfidf = "./tfidf.pickle"
        with open(path_tfidf, 'rb') as data:
            tfidf = pickle.load(data)
        
        
        # In[10]:
        category_codes = {
            'business': 0,
            'entertainment': 1,
            'politics': 2,
            'sport': 3,
            'tech': 4,
            'other':5
        }
        # ## 2.2 Feature Engineering
        # In[12]:
        
        punctuation_signs = list("?:!.,;")
        stop_words = list(stopwords.words('english'))
        
        def create_features_from_df(df):
            
            df['Content_Parsed_1'] = df['Title'].str.replace("\r", " ")
            df['Content_Parsed_1'] = df['Content_Parsed_1'].str.replace("\n", " ")
            df['Content_Parsed_1'] = df['Content_Parsed_1'].str.replace("    ", " ")
            df['Content_Parsed_1'] = df['Content_Parsed_1'].str.replace('"', '')
            
            df['Content_Parsed_2'] = df['Content_Parsed_1'].str.lower()
            
            df['Content_Parsed_3'] = df['Content_Parsed_2']
            for punct_sign in punctuation_signs:
                df['Content_Parsed_3'] = df['Content_Parsed_3'].str.replace(punct_sign, '')
                
            df['Content_Parsed_4'] = df['Content_Parsed_3'].str.replace("'s", "")
            
            wordnet_lemmatizer = WordNetLemmatizer()
            nrows = len(df)
            lemmatized_text_list = []
            for row in range(0, nrows):
        
                # Create an empty list containing lemmatized words
                lemmatized_list = []
                # Save the text and its words into an object
                text = df.loc[row]['Content_Parsed_4']
                text_words = text.split(" ")
                # Iterate through every word to lemmatize
                for word in text_words:
                    lemmatized_list.append(wordnet_lemmatizer.lemmatize(word, pos="v"))
                # Join the list
                lemmatized_text = " ".join(lemmatized_list)
                # Append to the list containing the texts
                lemmatized_text_list.append(lemmatized_text)
            
            df['Content_Parsed_5'] = lemmatized_text_list
            
            df['Content_Parsed_6'] = df['Content_Parsed_5']
            for stop_word in stop_words:
                regex_stopword = r"\b" + stop_word + r"\b"
                df['Content_Parsed_6'] = df['Content_Parsed_6'].str.replace(regex_stopword, '')
                
            df = df['Content_Parsed_6']
            df = df.rename({'Content_Parsed_6': 'Content_Parsed'})
            
            # TF-IDF
            features = tfidf.transform(df).toarray()
            
            return features
        
        # In[13]:
        
        def get_category_name(category_id):
            for category, id_ in category_codes.items():    
                if id_ == category_id:
                    return category
        
        # In[14]:
        
        def predict_from_features(features):
                
            # Obtain the highest probability of the predictions for each article
            predictions_proba = svc_model.predict_proba(features).max(axis=1)    
            
            # Predict using the input model
            predictions_pre = svc_model.predict(features)
        
            # Replace prediction with 6 if associated cond. probability less than threshold
            predictions = []
        
            for prob, cat in zip(predictions_proba, predictions_pre):
                if prob > .65:
                    predictions.append(cat)
                else:
                    predictions.append(5)
        
            # Return result
            categories = [get_category_name(x) for x in predictions]
            
            return categories
        
        # In[15]:
        
        def complete_df(df, categories):
            df['Prediction'] = categories
            return df
        
        # In[18]:
        
        
        #TRYING TO PREDICT FROM NEWS DATA, can ignore above
        wanted_ft = pd.DataFrame(
            {'Title': dataDF['title']}
        )
        
        #Columns wanted to display together with prediction
        wanted_cols = pd.DataFrame(
            {'Source': dataDF['source'],
             'publishedDate': dataDF['publishedDate'],
             'title': dataDF['title'],
             'views': dataDF['views'],
             'likes': dataDF['likes'],
             'dislikes': dataDF['dislikes'],
             'titleWords': dataDF['titleWords'],
             'link': dataDF['link']
            }
        )
        
        # Create features
        features = create_features_from_df(wanted_ft)
        
        # Predict
        predictions = predict_from_features(features)
        #%%
        # Put into dataset
        df = complete_df(wanted_cols, predictions)
        df = df.rename(columns ={'Prediction': 'Category'})
        df = df.to_dict('records')
        
        #%%
        ### Push the whole dataset back onto Firestore
        
        for rows in df:
            db.collection(u'NewsArticleData').add(rows)
            dataNews.append(rows)
            print(rows['title'] + " added. -> " + rows['Category'])
            
    else:
        print("No new articles")
    
    print("sleep 5s")
    time.sleep(5)

#end while true

