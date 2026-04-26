#!/usr/bin/env python3
"""Patch agora_viesco.js et agora_pixhare.js -> versions .local.js (LocalLLM partage v2.1)."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
ORIG_DIR = ROOT.parents[1] / "projet hub viesco"


def _do_replace_re(src, pattern, replacement):
    """re.sub mais sans interpretation des backslash dans replacement."""
    return pattern.sub(lambda m: replacement, src)


def patch_agora_viesco():
    src_path = ORIG_DIR / "agora_viesco.js"
    dst_path = ROOT / "agora_viesco.local.js"
    src = src_path.read_text(encoding="utf-8")

    header_orig = (
        "(function(){\n"
        "  var API_KEY='VIRuDMeF8Wz8DcdfEkW2BBvhD51jNCfg';\n"
        "  var API_URL='https://api.mistral.ai/v1/chat/completions';\n"
        "  var API_MODEL='mistral-small-latest';"
    )
    header_new = (
        "/* AGORA VIESCO - VERSION LOCALE (LocalLLM partage v2.1) */\n"
        "(function(){\n"
        "  var LLM_TEMPERATURE = 0.05;\n"
        "  var LLM_MAX_TOKENS  = 160;"
    )
    if header_orig not in src:
        print("[viesco] header non trouve")
        return False
    src = src.replace(header_orig, header_new)

    askAssistant_pattern = re.compile(
        r"  async function askAssistant\(userText\)\{.*?    return \{answer:answer,docs:docs\};\n  \}",
        re.DOTALL,
    )
    askAssistant_new = (
        "  async function askAssistant(userText){\n"
        "    var docs=await gatherContext(userText);\n"
        "    var systemRaw=(await loadPrompt()).trim();\n"
        "    var history=store.messages.filter(function(msg){return msg.role==='user'||msg.role==='assistant';}).slice(-CFG.historyLimit);\n"
        "    var convo=history.slice(0,Math.max(history.length-1,0)).map(function(msg){\n"
        "      return {role:msg.role,content:msg.content};\n"
        "    });\n"
        "    if(!window.LocalLLM){throw new Error('LocalLLM absent. Inclus local_llm.js avant ce fichier.');}\n"
        "    if(!window.LocalLLM.isReady()){throw new Error(\"Assistant local non active. Clique sur le bouton 'Activer l'assistant local'.\");}\n"
        "    var systemFull = window.LocalLLM.SOCLE_COMMUN + \"\\n\\n\" + systemRaw;\n"
        "    var messages=[{role:'system',content:systemFull}].concat(convo).concat([{role:'user',content:buildUserEnvelope(userText,docs)}]);\n"
        "    var result=await window.LocalLLM.askMessages(messages,{\n"
        "      temperature: Number(CFG.temperature||LLM_TEMPERATURE),\n"
        "      maxTokens:   Number(CFG.maxTokens||LLM_MAX_TOKENS),\n"
        "      topK: 20, topP: 0.75, repeatPenalty: 1.20\n"
        "    });\n"
        "    if(!result.ok)throw new Error('LocalLLM: '+(result.error||'erreur'));\n"
        "    var answer=result.text||'';\n"
        "    if(!answer)throw new Error('Reponse vide');\n"
        "    return {answer:answer,docs:docs};\n"
        "  }"
    )
    if not askAssistant_pattern.search(src):
        print("[viesco] askAssistant pattern non trouve")
        return False
    src = _do_replace_re(src, askAssistant_pattern, askAssistant_new)

    dst_path.write_text(src, encoding="utf-8")
    delta = src.count("{") - src.count("}")
    print("[viesco] OK -> %s (delta accolades %d)" % (dst_path.name, delta))
    return True


def patch_agora_pixhare():
    src_path = ORIG_DIR / "agora_pixhare.js"
    dst_path = ROOT / "agora_pixhare.local.js"
    src = src_path.read_text(encoding="utf-8")

    header_orig = (
        "(function(){\n"
        "  var KERN_KEY='VIRuDMeF8Wz8DcdfEkW2BBvhD51jNCfg';\n"
        "  var KERN_URL='https://api.mistral.ai/v1/chat/completions';\n"
        "  var KERN_MODEL='mistral-small-latest';\n"
        "  var KERN_TEMP=0.95;\n"
        "  var KERN_ANALYSIS_TEMP=0.1;\n"
        "  var KERN_MAX_TOKENS=1000;"
    )
    header_new = (
        "/* AGORA PIXHARE (Kern) - VERSION LOCALE (LocalLLM partage v2.1) */\n"
        "(function(){\n"
        "  var KERN_TEMP=0.05;\n"
        "  var KERN_ANALYSIS_TEMP=0.0;\n"
        "  var KERN_MAX_TOKENS=160;"
    )
    if header_orig not in src:
        print("[pixhare] header non trouve")
        return False
    src = src.replace(header_orig, header_new)

    complete_orig = (
        "async function complete(messages,temp,maxTokens){\n"
        "    var res=await fetch(KERN_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+KERN_KEY},body:JSON.stringify({model:KERN_MODEL,messages:messages,temperature:typeof temp==='number'?temp:KERN_TEMP,max_tokens:maxTokens||KERN_MAX_TOKENS})});\n"
        "    var data=await res.json().catch(function(){return {};});\n"
        "    if(res.ok&&data.choices&&data.choices[0]&&data.choices[0].message)return data.choices[0].message.content||'';\n"
        "    if(data&&data.error&&data.error.message)throw new Error(data.error.message);\n"
        "    if(data&&data.message)throw new Error(data.message);\n"
        "    throw new Error('Reponse API indisponible.');\n"
        "  }"
    )
    complete_new = (
        "async function complete(messages,temp,maxTokens){\n"
        "    if(!window.LocalLLM){throw new Error('LocalLLM absent. Inclus local_llm.js avant ce fichier.');}\n"
        "    if(!window.LocalLLM.isReady()){throw new Error(\"Assistant local non active. Clique sur le bouton 'Activer l'assistant local'.\");}\n"
        "    var augmented=messages.map(function(m){\n"
        "      if(m && m.role==='system'){\n"
        "        return {role:'system', content: window.LocalLLM.SOCLE_COMMUN + \"\\n\\n\" + (m.content||'')};\n"
        "      }\n"
        "      return m;\n"
        "    });\n"
        "    var result=await window.LocalLLM.askMessages(augmented,{\n"
        "      temperature: typeof temp==='number'?temp:KERN_TEMP,\n"
        "      maxTokens:   maxTokens||KERN_MAX_TOKENS,\n"
        "      topK: 20, topP: 0.75, repeatPenalty: 1.20\n"
        "    });\n"
        "    if(!result.ok)throw new Error('LocalLLM Kern: '+(result.error||'erreur'));\n"
        "    return result.text||'';\n"
        "  }"
    )
    if complete_orig not in src:
        print("[pixhare] complete pattern non trouve")
        return False
    src = src.replace(complete_orig, complete_new)

    dst_path.write_text(src, encoding="utf-8")
    delta = src.count("{") - src.count("}")
    print("[pixhare] OK -> %s (delta accolades %d)" % (dst_path.name, delta))
    return True


if __name__ == "__main__":
    ok1 = patch_agora_viesco()
    ok2 = patch_agora_pixhare()
    sys.exit(0 if (ok1 and ok2) else 1)
