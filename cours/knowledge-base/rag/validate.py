#!/usr/bin/env python3
"""Contrôle minimal de cohérence entre le registre de sources, le RAG et les affirmations."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load(name: str) -> list[dict]:
    path = ROOT / name
    rows: list[dict] = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise ValueError(f"{name}:{line_number}: JSON invalide ({exc.msg})") from exc
    return rows


def load_json(name: str) -> dict:
    path = ROOT / name
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"{name}: JSON invalide ({exc.msg})") from exc
    if not isinstance(value, dict):
        raise ValueError(f"{name}: objet JSON attendu")
    return value


def require(row: dict, fields: tuple[str, ...], location: str, errors: list[str]) -> None:
    missing = [field for field in fields if not row.get(field)]
    if missing:
        errors.append(f"{location}: champs requis manquants : {', '.join(missing)}")


def duplicates(rows: list[dict], label: str, errors: list[str]) -> set[str]:
    identifiers: set[str] = set()
    for number, row in enumerate(rows, start=1):
        identifier = row.get("id")
        if identifier in identifiers:
            errors.append(f"{label}:{number}: identifiant dupliqué : {identifier}")
        identifiers.add(identifier)
    return identifiers


def validate_curriculum(curriculum: dict, source_ids: set[str], errors: list[str]) -> int:
    levels = curriculum.get("levels")
    if not isinstance(levels, list) or not levels:
        errors.append("programmes-officiels: levels doit être une liste non vide")
        return 0
    for number, level in enumerate(levels, start=1):
        require(level, ("grade", "cycle", "weekly_common_hours", "programmes"),
                f"programmes-officiels:levels:{number}", errors)
        programmes = level.get("programmes")
        if not isinstance(programmes, list) or not programmes:
            errors.append(f"programmes-officiels:levels:{number}: programmes doit être une liste non vide")
            continue
        for item_number, programme in enumerate(programmes, start=1):
            location = f"programmes-officiels:levels:{number}:programmes:{item_number}"
            require(programme, ("discipline", "status", "programme_source_id"), location, errors)
            source_id = programme.get("programme_source_id")
            if source_id and source_id not in source_ids:
                errors.append(f"{location}: source inconnue : {source_id}")
    alerts = curriculum.get("future_transition_alerts", [])
    if not isinstance(alerts, list):
        errors.append("programmes-officiels: future_transition_alerts doit être une liste")
    else:
        for number, alert in enumerate(alerts, start=1):
            location = f"programmes-officiels:alerts:{number}"
            require(alert, ("subject",), location, errors)
            linked = []
            if alert.get("source_id"):
                linked.append(alert["source_id"])
            if isinstance(alert.get("source_ids"), list):
                linked.extend(alert["source_ids"])
            if not linked:
                errors.append(f"{location}: source_id ou source_ids requis")
            for source_id in linked:
                if source_id not in source_ids:
                    errors.append(f"{location}: source inconnue : {source_id}")
    return len(levels)


def validate_history_course(course: dict, source_ids: set[str], errors: list[str]) -> int:
    location = "cours/histoire/6e/modules.json"
    require(course, ("version", "level", "school_year", "official_program", "learning_model", "media_plan", "modules"), location, errors)
    if course.get("level") != "6e":
        errors.append(f"{location}: level doit être 6e")
    official_program = course.get("official_program")
    if not isinstance(official_program, dict):
        errors.append(f"{location}: official_program doit être un objet")
    else:
        require(official_program, ("source_id", "reference", "applicability_checked"), f"{location}:official_program", errors)
        source_id = official_program.get("source_id")
        if source_id and source_id not in source_ids:
            errors.append(f"{location}:official_program: source inconnue : {source_id}")
    learning_model = course.get("learning_model")
    if not isinstance(learning_model, dict):
        errors.append(f"{location}: learning_model doit être un objet")
    else:
        require(learning_model, ("narrative_frame", "operations", "prohibited_mechanics"), f"{location}:learning_model", errors)
        for field in ("operations", "prohibited_mechanics"):
            if field in learning_model and not isinstance(learning_model[field], list):
                errors.append(f"{location}:learning_model:{field} doit être un tableau")
    modules = course.get("modules")
    if not isinstance(modules, list) or not modules:
        errors.append(f"{location}: modules doit être une liste non vide")
        return 0
    if len(modules) != 9:
        errors.append(f"{location}: le parcours 6e doit référencer ses 9 modules, {len(modules)} trouvés")
    module_ids = duplicates(modules, "cours/histoire/6e/modules", errors)
    module_dir = ROOT / "cours" / "histoire" / "6e"
    files: set[str] = set()
    for number, module in enumerate(modules, start=1):
        module_location = f"{location}:modules:{number}"
        require(module, ("id", "theme", "official_subtheme", "title", "file", "sources"), module_location, errors)
        if not isinstance(module.get("sources"), list) or not module["sources"]:
            errors.append(f"{module_location}: sources doit être un tableau non vide")
        else:
            for source_id in module["sources"]:
                if source_id not in source_ids:
                    errors.append(f"{module_location}: source inconnue : {source_id}")
        if "next" not in module or not isinstance(module.get("next"), list):
            errors.append(f"{module_location}: next doit être un tableau")
        else:
            for next_id in module["next"]:
                if next_id not in module_ids:
                    errors.append(f"{module_location}: module suivant inconnu : {next_id}")
        relative_path = module.get("file", "")
        candidate = Path(relative_path)
        if candidate.is_absolute() or ".." in candidate.parts or candidate.suffix != ".md":
            errors.append(f"{module_location}: chemin de module invalide : {relative_path}")
            continue
        file_path = module_dir / candidate
        files.add(str(candidate).replace("\\", "/"))
        if not file_path.is_file():
            errors.append(f"{module_location}: fichier absent : {relative_path}")
    existing = {
        str(path.relative_to(module_dir)).replace("\\", "/")
        for path in (module_dir / "modules").glob("*.md")
    }
    orphaned = existing - files
    if orphaned:
        errors.append(f"{location}: modules non indexés : {', '.join(sorted(orphaned))}")
    return len(modules)


def validate_history_media_plan(media_plan: dict, course: dict, source_ids: set[str], errors: list[str]) -> int:
    location = "cours/histoire/6e/media-plan.json"
    require(media_plan, ("version", "purpose", "source_policy", "accessibility_defaults", "modules"), location, errors)
    source_policy = media_plan.get("source_policy")
    if not isinstance(source_policy, dict):
        errors.append(f"{location}: source_policy doit être un objet")
    else:
        require(source_policy, ("required_metadata", "prohibited"), f"{location}:source_policy", errors)
    defaults = media_plan.get("accessibility_defaults")
    if not isinstance(defaults, dict):
        errors.append(f"{location}: accessibility_defaults doit être un objet")
    else:
        required_defaults = ("audio_autoplay", "motion_autoplay", "media_controls", "equivalents", "fallback")
        missing_defaults = [field for field in required_defaults if field not in defaults]
        if missing_defaults:
            errors.append(f"{location}:accessibility_defaults: champs requis manquants : {', '.join(missing_defaults)}")
        if defaults.get("audio_autoplay") is not False or defaults.get("motion_autoplay") is not False:
            errors.append(f"{location}: l'audio et le mouvement doivent être désactivés par défaut")
    modules = media_plan.get("modules")
    if not isinstance(modules, list) or not modules:
        errors.append(f"{location}: modules doit être une liste non vide")
        return 0
    media_ids: set[str] = set()
    for number, module in enumerate(modules, start=1):
        module_id = module.get("module_id")
        if not module_id:
            errors.append(f"{location}:modules:{number}: module_id requis")
            continue
        if module_id in media_ids:
            errors.append(f"{location}:modules:{number}: identifiant dupliqué : {module_id}")
        media_ids.add(module_id)
    course_modules = course.get("modules", [])
    course_ids = {module.get("id") for module in course_modules if module.get("id")}
    if media_ids != course_ids:
        errors.append(f"{location}: les modules média doivent correspondre exactement à l'index de cours")
    for number, module in enumerate(modules, start=1):
        module_location = f"{location}:modules:{number}"
        require(module, ("module_id", "primary_media", "active_variant", "audio_option"), module_location, errors)
        primary_media = module.get("primary_media")
        if not isinstance(primary_media, dict):
            errors.append(f"{module_location}: primary_media doit être un objet")
            continue
        require(primary_media, ("type", "operation", "source_ids", "alternative"), f"{module_location}:primary_media", errors)
        if not isinstance(primary_media.get("source_ids"), list) or not primary_media["source_ids"]:
            errors.append(f"{module_location}:primary_media: source_ids doit être un tableau non vide")
        else:
            for source_id in primary_media["source_ids"]:
                if source_id not in source_ids:
                    errors.append(f"{module_location}:primary_media: source inconnue : {source_id}")
    return len(modules)


def main() -> int:
    errors: list[str] = []
    try:
        sources = load("sources/sources.jsonl")
        chunks = load("rag/chunks.jsonl")
        claims = load("evidence/claims.jsonl")
        queries = load("rag/queries.jsonl")
        curriculum = load_json("programmes-officiels/programmes-2026-2027.json")
        history_course = load_json("cours/histoire/6e/modules.json")
        history_media_plan = load_json("cours/histoire/6e/media-plan.json")
    except (OSError, ValueError) as exc:
        print(f"Échec du contrôle : {exc}")
        return 1

    source_ids = duplicates(sources, "sources", errors)
    duplicates(chunks, "chunks", errors)
    duplicates(claims, "claims", errors)
    duplicates(queries, "queries", errors)

    for number, source in enumerate(sources, start=1):
        require(source, ("id", "title", "publisher", "url", "type", "year", "authority", "scope"),
                f"sources:{number}", errors)
    for number, chunk in enumerate(chunks, start=1):
        require(chunk, ("id", "source_id", "title", "text", "domain", "tags"),
                f"chunks:{number}", errors)
        if chunk.get("source_id") not in source_ids:
            errors.append(f"chunks:{number}: source inconnue : {chunk.get('source_id')}")
        if not isinstance(chunk.get("tags"), list):
            errors.append(f"chunks:{number}: tags doit être un tableau")
    for number, claim in enumerate(claims, start=1):
        require(claim, ("id", "claim", "source_ids", "confidence", "limits"),
                f"claims:{number}", errors)
        if not isinstance(claim.get("source_ids"), list):
            errors.append(f"claims:{number}: source_ids doit être un tableau")
            continue
        for source_id in claim["source_ids"]:
            if source_id not in source_ids:
                errors.append(f"claims:{number}: source inconnue : {source_id}")
    for number, query in enumerate(queries, start=1):
        require(query, ("id", "date", "query", "domain", "result", "follow_up"),
                f"queries:{number}", errors)

    curriculum_level_count = validate_curriculum(curriculum, source_ids, errors)
    history_module_count = validate_history_course(history_course, source_ids, errors)
    history_media_count = validate_history_media_plan(history_media_plan, history_course, source_ids, errors)

    if errors:
        print("Contrôle échoué :")
        print("\n".join(f"- {error}" for error in errors))
        return 1
    print(
        "Contrôle réussi : "
        f"{len(sources)} sources, {len(chunks)} passages, {len(claims)} affirmations, {len(queries)} requêtes, "
        f"{curriculum_level_count} niveaux de programme, {history_module_count} modules d'histoire 6e, "
        f"{history_media_count} plans média."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
