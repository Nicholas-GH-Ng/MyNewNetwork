# -*- coding: utf-8 -*-
"""
Created on Sun Sep 13 21:58:36 2020

@author: Joshua Lee
"""
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

from bs4 import BeautifulSoup
import requests
import pandas as pd
import copy
from datetime import datetime, date, time, timezone

cred = credentials.Certificate("./serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

#%% Import spacy for nlp
import spacy
nlp = spacy.load('en_core_web_sm')

#%%

topnews_url = 'https://news.google.com/rss'

response = requests.get(topnews_url)
soup = BeautifulSoup(response.content, features = 'xml')

items = soup.find_all('item')

newsItems = []
dataNews = []
doc_ref = db.collection(u'NewsArticleTest1').document(u'News')
docs = db.collection(u'NewsArticleTest1').stream()

# fill array with database news
for doc in docs:
    dataNews.append(doc.to_dict())
    
#for doc in dataNews:
#    print(doc)

#%%
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

    newsItem['likes'] = 0
    newsItem['dislikes'] = 0
    newsItem['views'] = 0    

    newsCheck = False
    
    for doc in dataNews:
        if(newsItem['title'] == doc['title']):
            newsCheck = True
            #print(newsItem['title'] + " Found FALSE");

    if(newsCheck == False):
        newsItems.append(newsItem)
        print(newsItem['title'] + " added");
    

for news in newsItems:
    db.collection(u'NewsArticleTest1').add(news)


#doc = doc_ref.get()
#print(u'Document data: {}'.format(doc.to_dict()))

#try:
#    doc = doc_ref.get()
#    for news in newsItems:
#        doc_ref.set(news.to_dict())
        
#    print(u'Document data: {}'.format(doc.to_dict()))

#except google.cloud.exceptions.NotFound:
#    print(u'No such document!')

#%% Creating a Pandas DF with the appended dictionary
#news_df = pd.DataFrame(newsItems)
#pd.set_option('max_colwidth', 800)

#%% Exporting results to a CSV file, testnewsdf.csv
#news_df.to_csv(r'C:\Users\Nicholas Ng\Desktop\testgoogleFeed.csv', mode ='a')
