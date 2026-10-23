# Player Recommender

A work-in-progress NBA app for searching players and browsing player and team statistics. Django provides the API, while a React frontend displays the data. Future plans include player recommendations for team needs and player archetypes.

## Tools

- Python and Django: backend, API, and CSV import
- SQLite: local database
- React and TypeScript: frontend
- Vite: frontend development and builds
- Tailwind CSS: frontend styling
- CSV datasets: player and team data

## Setup

Prerequisites: Python, Node.js, and npm.

From the repository root, install Django if needed, then set up the database and import CSV data:

```powershell
python -m pip install Django
python manage.py migrate
python import_players.py
```

Install frontend packages from the `Frontend/` directory:

```powershell
cd Frontend
npm install
```

## Run

Use two terminals. From the repository root, start Django:

```powershell
python manage.py runserver
```

From `Frontend/`, start React:

```powershell
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Checks

From the repository root:

```powershell
python manage.py test Trialapp
```

From `Frontend/`:

```powershell
npm run lint
npm run build
```
