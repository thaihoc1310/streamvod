# streamvod
A Video-on-Demand Streaming Platform

📄 **Documentation**: [Final Report (INT3319_3_group_4_final_report.pdf)](./INT3319_3_group_4_final_report.pdf)

## How to run the frontend

INSTALL NODEJS AND NPM FIRST, THEN FOLLOW THE STEPS BELOW:

```bash
cd frontend
npm install
npm run dev
```

## How to run the backend

YOU MUST INSTALL `python3` AND `pip` FIRST, then follow the steps below:

```bash 
cd backend
```

Create a virtual environment:
```bash
python3 -m venv venv
# or
python -m venv venv
```

Activate the virtual environment:
```bash
# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

When successfully activated, your terminal prompt will change to show:
```ruby
(venv) 
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Navigate to the app directory:
```bash
cd app
```

Run the application (there are 2 ways; for development, run the following):

```bash
fastapi dev main.py
```

For deployment, run:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
