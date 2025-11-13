# streamvod
A Video-on-Demand Streaming Platform

#Cách chạy frontend

CÀI NODEJS VÀ NPM TRƯỚC SAU ĐÓ LÀM THEO DƯỚI:

```bash
cd frontend
```
```bash
npm install
```

```bash
npm run dev
```
#Cách chạy backend

PHẢI CÀI python3 VÀ pip TRƯỚC sau đó làm như dưới


```bash
cd backend
```

```bash
python3 -m venv venv
python -m venv venv
```


```bash
# macOS / Linux
source venv/bin/activate


# Windows
venv\Scripts\activate
```

Khi bật thành công, bạn sẽ thấy terminal đổi thành:
```ruby
(venv) 
```

```bash
pip install -r requirements.txt
```

```bash
cd app
```

chạy (có 2 cách, nếu dev phát triển thì chạy):

```bash
fastapi dev main.py
```

deployment thì chạy
```bash
uvicorn main:app --reload
```

docker-compose -f infra/docker-compose.yml up -d
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
