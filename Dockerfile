FROM python:3.9

WORKDIR /code

# 1. Paksa Python untuk mengenali folder /code sebagai tempat mencari modul
ENV PYTHONPATH=/code

# 2. Menyalin berkas requirements.txt ke dalam root kontainer
COPY ./requirements.txt /code/requirements.txt

# 3. Menginstal seluruh dependensi Python
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 4. Menyalin semua folder yang dibutuhkan
COPY ./api /code/api
COPY ./ml /code/ml
COPY ./models /code/models

# 5. PERBAIKAN RUTE: Eksekusi menggunakan pemanggil modul python -m
CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]