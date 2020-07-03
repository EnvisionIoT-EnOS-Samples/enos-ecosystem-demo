FROM python:3.7

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["./wait-for-it.sh", "edge-gateway:9000", "--", "python", "./index.py" ]