.PHONY: setup data train evaluate test api ui all clean

PYTHON := .venv/bin/python
PIP := .venv/bin/pip
PYTEST := .venv/bin/pytest
UVICORN := .venv/bin/uvicorn

setup:
	python3 -m venv .venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	cd frontend && npm install

data:
	PYTHONPATH=. $(PYTHON) -m src.data.synthetic_generator

train:
	PYTHONPATH=. $(PYTHON) src/train.py

evaluate:
	PYTHONPATH=. $(PYTHON) src/evaluate.py

test:
	PYTHONPATH=. $(PYTEST) tests/ -v

api:
	PYTHONPATH=. $(UVICORN) src.api.main:app --host 127.0.0.1 --port 8000 --reload

ui:
	cd frontend && npm run dev

all: data train evaluate test

clean:
	rm -rf __pycache__ .pytest_cache artifacts/models/* artifacts/plots/* artifacts/reports/*
