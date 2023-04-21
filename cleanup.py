import os
import csv
import pandas as pd
from collections import Counter

character_name_dict = {}

def clear_modifiers(input):
    df = pd.read_csv(input, encoding="unicode_escape")
    df["Modifier"] = None
    for point in range(len(df)):
        curr_speaker = str(df["Speaker"][point])
        speaker_modifier_arr = curr_speaker.split('(')
        df["Speaker"][point] = speaker_modifier_arr[0].strip()
        if(len(speaker_modifier_arr) > 1):
            df["Modifier"][point] = '(' + speaker_modifier_arr[1].strip()
        else:
            df["Modifier"][point] = None
    return df
        


def single_word_name_lookup(df):
    for point in range(len(df)):
        curr_speaker = str(df["Speaker"][point])
        if(len(curr_speaker.split()) < 2):
            character_name_dict[curr_speaker.lower()] = None
    

def multi_word_name_lookup(df):
    for point in range(len(df)):
        curr_speaker = str(df["Speaker"][point])
        if(len(curr_speaker.split()) > 1 and len(curr_speaker.split()) < 3):
            if(curr_speaker.split()[0].lower() in character_name_dict):
                character_name_dict[curr_speaker.split()[0].lower()] = curr_speaker.title()

def word_replacement(df):
    for point in range(len(df)):
        try:
            curr_speaker = str(df["Speaker"][point])
            if(curr_speaker.lower() in character_name_dict):
                if(character_name_dict[curr_speaker.lower()] != None):
                    df["Speaker"][point] = character_name_dict[curr_speaker.lower()]
            df["Speaker"][point] = df["Speaker"][point].title()
        except KeyError:
            print("something went wrong with", curr_speaker)
            continue
    print(df)
    return df


df = clear_modifiers('./data/game-of-thrones.csv')
single_word_name_lookup(df)
multi_word_name_lookup(df)
replaced_df = word_replacement(df)

replaced_df.to_csv('./data/game-of-thrones-cleaned.csv', sep=',', encoding='utf-8')
