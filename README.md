# Reading Intelligence Dashboard

A client-side reading analytics and behavioural book recommendation tool built from a Goodreads library export.

This project explores how far structured decision modelling can go using only local data. There is no backend, no AI, and no persistent storage.

---

## Overview

This application allows you to:

- Upload your Goodreads CSV export  
- Analyse your reading habits and patterns  
- Explore backlog insights  
- Receive a structured recommendation based on behavioural preferences  
- View cover art for the selected recommendation  

Everything runs entirely in the browser.

No data is uploaded. No external database is used.

---

## Purpose

Most recommendation systems rely on:

- Machine learning  
- External metadata APIs  
- Collaborative filtering  
- Black-box models  

This project takes a different approach.

It demonstrates how a thoughtful recommendation engine can be built using deterministic logic and behavioural data derived from a user’s own reading history.

The guided decision funnel uses:

- Reading length preferences  
- Publication era tendencies  
- Author familiarity  
- Backlog age  
- Rating confidence versus risk tolerance  

All computed locally.

---

## Features

### Reading Analytics

- Total books read versus unread  
- Average pages per book  
- Median publication year  
- Rating behaviour analysis  
- Author diversity score  
- Books read per year  
- Backlog age distribution  
- Longest and highest-rated unread books  

---

### Behavioural Decision Funnel

A four-step guided recommendation flow:

1. **Time investment**  
   Quick read or long immersion  

2. **Familiar versus different**  
   Stick to what you typically enjoy or explore outside your usual patterns  

3. **Backlog age**  
   Clear something old or read something recently added  

4. **Safety versus risk**  
   Highest rated or slightly experimental  

The engine narrows candidates progressively and applies deterministic scoring.

No randomness is required.

---

### Cover Art

Once a recommendation is selected, the app fetches cover art using the Open Library Covers API via ISBN.

No metadata enrichment is required.

---

## Architecture

- Static single-page application  
- Vanilla JavaScript  
- No frameworks  
- No backend  
- No build tools  
- No persistent storage  
- Runs by simply opening `index.html`  

The system is structured around:

- Data ingestion layer  
- Analytics layer  
- Behaviour profiling  
- Guided decision engine  
- Presentation layer  

All logic is modular and deterministic.

---

## Data Source

The app uses a Goodreads library export (CSV).

To export your library:

1. Log into Goodreads  
2. Go to **My Books**  
3. Click **Import and Export**  
4. Click **Export Library**  
5. Download the generated CSV file  
6. Upload it into the app  

Note: Use a browser rather than the Goodreads mobile app to access the export feature.

---

## Running the Project

Clone the repository:

```bash
git clone https://github.com/yourusername/reading-intelligence-dashboard.git
