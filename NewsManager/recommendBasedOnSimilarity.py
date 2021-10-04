import pandas as pd
import numpy as np
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel


# In[2]:


import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore


# In[33]:

import time
import random


if not firebase_admin._apps:
    cred = credentials.Certificate("./serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    print("No firebase app running")
    
db = firestore.client()

dataNews = []

docs = db.collection(u'NewsArticleData').stream()

# fill array with database news
for doc in docs:
    newsdoc = doc.to_dict()
    newsdoc['doc_id'] = f'{doc.id}'
    
    dataNews.append(newsdoc)


dataDF = pd.DataFrame(dataNews)


# In[5]:


#Codes to represent the category
category_codes = {
    'business': 0,
    'entertainment': 1,
    'politics': 2,
    'sport': 3,
    'tech': 4,
    'other':5 }


# In[6]:


testUsers = {
    "user1": {
        "name": "Johnson McBurgers",
        "userid": "U120",
        "preference": "entertainment, business, tech",
        "History": "0PYW8HtkJlcZT6IR4rPj, 0U6s5H0lkOSdAGB1dK3V, NEaCEcBIjIVhRVbPTZtt"
    },
    
    "user2": {
        "name": "Katie St.Apples",
        "userid": "U1622",
        "preference": "business, entertainment"
    },
    
    "user3": {
        "name": "Douglas DePepe",
        "userid": "U5234",
        "preference": "entertainment, politics, sport, tech"
    }
}


# In[106]:


dataDF.head(196)


# In[80]:


featureCol = dataDF[['doc_id', 'title']]


# In[109]:


tfidf = TfidfVectorizer(analyzer='word',
                    ngram_range=(1, 3),
                    min_df=0,
                    stop_words='english')

tfidf_matrix = tfidf.fit_transform(featureCol['title'])
cosine_similarities = linear_kernel(tfidf_matrix, tfidf_matrix)

results = {}


# In[110]:


for idx, row in dataDF.iterrows():
           similar_indices = cosine_similarities[idx].argsort()[:-100:-1]
           similar_items = [(cosine_similarities[idx][i], featureCol['doc_id'][i])
                            for i in similar_indices]

           # First item is the item itself, so remove it.
           # This 'sum' is turns a list of tuples into a single tuple:
           # [(1,2), (3,4)] -> (1,2,3,4)
           results[row['doc_id']] = similar_items[1:]


# In[119]:


def item(id):
    return featureCol.loc[featureCol['doc_id'] == id]['title'].tolist()[0].split(' - ')[0]


# In[131]:


def recommend(item_id, num):
    print("Recommending " + str(num) + " products similar to \n" + item(item_id) + "...")
    print("-------")
    recs = results[item_id][:num]

    for rec in recs:
        print("Recommended: " + item(rec[1]) + "(score: " + str(rec[0]) + ")")


# In[134]:


#recommend("0U6s5H0lkOSdAGB1dK3V", 10)


#FUNCTION TO GET MAINFEED SCORE
# viewlist = array of articleID 
# get view list results and add to totalscore
# total score is final results




def fullScore(viewList):
    #loop through viewlist
    totalScore = []
    for article in viewList:
        #get Scores per article
        articleScore = results[article][:100]
        #loop throug scores
        for score in articleScore:
            artFound = False
            x = list(score)
            #loop through total score
            for rec in totalScore:
                #if found add scores else add article to totalScore
                if(rec[1] == x[1]):
                    rec[0] = rec[0] + x[0]
                    artFound=True
            if(artFound == False):
                totalScore.append(x)
            #endforTS
        #endforAS
    #endforCA
    return totalScore
#endFunction

def updateRec(userHis, userID):
    FS = fullScore(userHis)
    FS.sort(reverse=True)
    
    AllArt = []
    for rec in FS:
        AllArt.append(rec[1])
    
    for art in userHis:
        for rec in AllArt:
            if(art==rec):
                AllArt.remove(rec)
                #print("removed "+rec)
         
    
    finalRec = AllArt[:100]
    db.collection(u'users').document(userID).update({u'Recommended': firestore.DELETE_FIELD})
    time.sleep(1)
    db.collection(u'users').document(userID).update({u'Recommended': finalRec})

def updateDB():
    userCol = db.collection(u'users').stream()
    
    for users in userCol:
        data = users.to_dict()
        uHistory = data.get("History")
        if uHistory:
            updateRec(uHistory, users.id)
    
while True:
    updateDB()
    print("sleep 5s")
    time.sleep(1)

#userSS = db.collection(u'users').document(u'0ajQYLEx6hUP2hvu1DhUXykx7tn1').get()


#userData = userSS.to_dict()
#userHis = userData.get("History")

#updateRec(userHis, '0ajQYLEx6hUP2hvu1DhUXykx7tn1')