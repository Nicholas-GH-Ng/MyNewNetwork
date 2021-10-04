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


topnews_url = 'https://news.google.com/rss'

response = requests.get(topnews_url)
soup = BeautifulSoup(response.content, features = 'xml')

items = soup.find_all('item')

newsItems = []
data = []
#doc_ref = db.collection(u'NewsArticleData').document(u'News')
docs = db.collection(u'NewsArticleData').stream()

# fill array with database news
for doc in docs:
    
    #view = int(random.randint(1, 3000)*random.randint(1, 5)*random.randint(5, 30)/random.randint(7, 11))
    #like = int(view /random.randint(6, 10)*random.randint(5, 30)/random.randint(5, 30))
    #dislike = int(view /random.randint(20, 50)*random.randint(5, 30)/random.randint(5, 30)/random.randint(5, 30))
    
    #ref = db.collection('NewsArticleTest1').document(doc.id)
    #ref.update({'views': view, "likes": like, "dislikes": dislike})
    
    data = doc.to_dict()
    words = []
    
    for word in data['title'].lower().split():
        words.append(word)
    
    ref = db.collection('NewsArticleData').document(doc.id)
    ref.update({'titleWords': words})
    print(data['title'] + " updated")

#%%