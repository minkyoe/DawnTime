import random
from lxml.html import parse
import requests
from io import StringIO
import os,sys
from PIL import Image

keyword = input("search image : ")

url = 'https://www.google.co.kr/search?q='+keyword+'&source=lnms&tbm=isch&sa=X&ved=0ahUKEwic-taB9IXVAhWDHpQKHXOjC14Q_AUIBigB&biw=1842&bih=990'
text = requests.get(url, headers={'user-agent': ':Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'}).text
text_source = StringIO(text)
parsed = parse(text_source)
doc = parsed.getroot()
imgs = doc.findall('.//img')
img_list = []

for a in imgs:
   img_list.append(a.get('data-src'))
    if a.get('data-src') != None:
      name = random.randrange(1,1000)
      full_name = str(name)+".jpg"
      urllib.request.urlretrieve(a.get('data-src'),full_name)
