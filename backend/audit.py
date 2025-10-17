from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-small")
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-small")

def explain_risks(os_apps, browser_exts, account_apps):
    summary_text = f"OS Apps: {os_apps[:10]}, Browser Extensions: {browser_exts[:5]}, Connected Apps: {account_apps}"
    inputs = tokenizer(f"Explain privacy risks in plain language:\n{summary_text}", return_tensors="pt")
    outputs = model.generate(**inputs, max_new_tokens=150)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)
