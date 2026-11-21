#!/usr/bin/env python3
"""Recherche locale transparente dans les passages de la base de connaissances.

Les résultats sont des pistes sourcées à relire, jamais une réponse autonome.
Fonctionne avec la bibliothèque standard de Python.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CHUNKS_PATH = ROOT / "rag" / "chunks.jsonl"
SOURCES_PATH = ROOT / "sources" / "sources.jsonl"


def load_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise SystemExit(f"JSON invalide : {path}:{number} — {exc.msg}") from exc
    return rows


def normalise(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value)).lower()
    return "".join(char for char in text if not unicodedata.combining(char))


def tokenize(value: object) -> list[str]:
    return re.findall(r"[^\W_]+", normalise(value), flags=re.UNICODE)


def indexed_text(chunk: dict) -> str:
    tags = " ".join(chunk.get("tags", []))
    return " ".join((chunk.get("title", ""), tags, chunk.get("text", "")))


def bm25(query: list[str], documents: list[list[str]]) -> list[float]:
    if not documents:
        return []
    document_frequency: Counter[str] = Counter()
    counters = [Counter(document) for document in documents]
    for counter in counters:
        document_frequency.update(counter.keys())
    average_length = sum(len(document) for document in documents) / len(documents)
    k1, b = 1.5, 0.75
    scores: list[float] = []

    for document, counter in zip(documents, counters):
        score = 0.0
        for term in query:
            frequency = counter.get(term, 0)
            if not frequency:
                continue
            idf = math.log(1 + (len(documents) - document_frequency[term] + 0.5)
                           / (document_frequency[term] + 0.5))
            denominator = frequency + k1 * (1 - b + b * len(document) / average_length)
            score += idf * frequency * (k1 + 1) / denominator
        scores.append(score)
    return scores


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Récupère des passages sourcés dans le RAG local (BM25 transparent)."
    )
    parser.add_argument("query", help="Question ou mots-clés à rechercher.")
    parser.add_argument("--domain", help="Filtre exact de domaine, p. ex. histoire ou sciences.")
    parser.add_argument("--top-k", type=int, default=5, help="Nombre de passages (défaut : 5).")
    args = parser.parse_args()

    chunks = load_jsonl(CHUNKS_PATH)
    sources = {source["id"]: source for source in load_jsonl(SOURCES_PATH)}
    if args.domain:
        expected = normalise(args.domain)
        chunks = [chunk for chunk in chunks if normalise(chunk.get("domain", "")) == expected]

    query_terms = tokenize(args.query)
    if not query_terms:
        raise SystemExit("La requête ne contient aucun terme exploitable.")
    documents = [tokenize(indexed_text(chunk)) for chunk in chunks]
    scores = bm25(query_terms, documents)
    ranked = sorted(zip(scores, chunks), key=lambda item: item[0], reverse=True)
    results = [(score, chunk) for score, chunk in ranked if score > 0][: max(args.top_k, 0)]

    print(f"Requête : {args.query}")
    print("Les extraits sont des orientations : ouvrir la source originale avant toute affirmation.")
    if not results:
        print("Aucun passage pertinent. Consigner la lacune dans rag/queries.jsonl puis élargir le corpus.")
        return 0
    for rank, (score, chunk) in enumerate(results, start=1):
        source = sources.get(chunk["source_id"], {})
        print(f"\n{rank}. {chunk['id']}  score={score:.2f}  [{chunk['domain']}]")
        print(f"   {chunk['title']}")
        print(f"   {chunk['text']}")
        print(f"   Source {chunk['source_id']} — {source.get('title', 'source non résolue')}")
        print(f"   {source.get('url', 'URL manquante')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
