import os
import csv
import pandas as pd

def clean(input):
    df = pd.read_csv(input, encoding="unicode_escape")
    print(df.Speaker[500])

clean('./data/game-of-thrones.csv')
