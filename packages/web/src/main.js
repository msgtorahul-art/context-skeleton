import { skeletonize, estimateTokens } from '../../core/src/index.js';

// SAMPLE CODE PRESETS
const SAMPLES = {
  ts: `import { useState, useEffect } from 'react';
import { fetchUserData, updateProfile } from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

/**
 * Main User Dashboard Controller Component
 */
export function UserDashboard({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchUserData(userId);
        setUser(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  const handleSave = async (updatedName: string) => {
    if (!user) return;
    setLoading(true);
    const res = await updateProfile(user.id, { name: updatedName });
    setUser(res);
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user?.name}</h2>
    </div>
  );
}

export class AnalyticsTracker {
  private apiKey: string;
  constructor(key: string) {
    this.apiKey = key;
  }

  public trackEvent(eventName: string, payload: Record<string, any>) {
    const body = JSON.stringify({ event: eventName, payload, key: this.apiKey });
    fetch('https://analytics.internal/event', { method: 'POST', body });
    return true;
  }
}`,
  py: `import time
import requests

class ModelInferenceEngine:
    """Manages local model weights and execution pipeline"""
    def __init__(self, model_name: str, cache_dir: str = "/tmp/models"):
        self.model_name = model_name
        self.cache_dir = cache_dir
        self._initialize_weights()

    def _initialize_weights(self):
        print(f"Loading weights for {self.model_name}...")
        time.sleep(0.5)
        self.ready = True

    def predict(self, prompt: str, max_tokens: int = 512) -> str:
        if not self.ready:
            raise RuntimeError("Engine not ready")
        
        payload = {"prompt": prompt, "tokens": max_tokens}
        res = requests.post("http://localhost:8080/v1/completions", json=payload)
        data = res.json()
        return data.get("text", "")

def calculate_confidence_score(predictions: list) -> float:
    total = sum(p["score"] for p in predictions)
    return total / len(predictions) if predictions else 0.0`,
  go: `package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Customer struct {
	ID    string \`json:"id"\`
	Name  string \`json:"name"\`
	Email string \`json:"email"\`
}

// ProcessTransaction handles webhook events from payment gateway
func ProcessTransaction(w http.ResponseWriter, r *http.Request) {
	var cust Customer
	if err := json.NewDecoder(r.Body).Decode(&cust); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	fmt.Printf("Processing tx for customer: %s\\n", cust.Name)
	w.WriteHeader(http.StatusOK)
}`
};

// DOM ELEMENTS
const codeInput = document.getElementById('codeInput');
const codeOutput = document.getElementById('codeOutput');
const inputTokenCount = document.getElementById('inputTokenCount');
const outputTokenCount = document.getElementById('outputTokenCount');
const liveDollarSavings = document.getElementById('liveDollarSavings');
const badgeSnippet = document.getElementById('badgeSnippet');
const tabButtons = document.querySelectorAll('.tab-btn');
const btnCopySkeleton = document.getElementById('btnCopySkeleton');
const btnCopyBadge = document.getElementById('btnCopyBadge');
const copyCliBtn = document.getElementById('copyCliBtn');
const cliCommandText = document.getElementById('cliCommandText');
const pkgTabs = document.querySelectorAll('.pkg-tab');

// ROI CALCULATOR ELEMENTS
const spendSlider = document.getElementById('spendSlider');
const spendVal = document.getElementById('spendVal');
const roiOriginal = document.getElementById('roiOriginal');
const roiNew = document.getElementById('roiNew');
const roiAnnual = document.getElementById('roiAnnual');

// MODAL ELEMENTS
const checkoutModal = document.getElementById('checkoutModal');
const closeModal = document.getElementById('closeModal');
const modalPlanTitle = document.getElementById('modalPlanTitle');
const modalPlanPrice = document.getElementById('modalPlanPrice');
const checkoutBtns = document.querySelectorAll('.btn-checkout');

let currentLang = 'ts';

function updateSkeleton() {
  const code = codeInput.value;
  const filename = currentLang === 'py' ? 'file.py' : (currentLang === 'go' ? 'file.go' : 'file.tsx');
  
  const result = skeletonize(code, filename);
  
  codeOutput.value = result.skeletonCode;

  const origTokens = result.metrics.originalTokens;
  const skelTokens = result.metrics.skeletonTokens;
  const savedPct = result.metrics.percentageSaved;
  const savedDollars = result.metrics.dollarsSaved;

  inputTokenCount.textContent = `Original: ${origTokens} tokens`;
  outputTokenCount.textContent = `Skeleton: ${skelTokens} tokens (-${savedPct}%)`;
  liveDollarSavings.textContent = `$${savedDollars} / prompt`;
  badgeSnippet.textContent = `⚡ Context optimized by ContextSkeleton (Saved ${savedPct}% tokens)`;
}

function updateRoiCalculator() {
  if (!spendSlider) return;
  const monthlySpend = parseInt(spendSlider.value, 10);
  const newMonthlySpend = Math.round(monthlySpend * 0.22);
  const monthlySavings = monthlySpend - newMonthlySpend;
  const annualSavings = monthlySavings * 12;

  spendVal.textContent = `$${monthlySpend.toLocaleString()} / month`;
  roiOriginal.textContent = `$${monthlySpend.toLocaleString()}`;
  roiNew.textContent = `$${newMonthlySpend.toLocaleString()}`;
  roiAnnual.textContent = `$${annualSavings.toLocaleString()} / year`;
}

// INITIALIZE PLAYGROUND & ROI
if (codeInput) {
  codeInput.value = SAMPLES.ts;
  updateSkeleton();
}
updateRoiCalculator();

// EVENT LISTENERS
codeInput?.addEventListener('input', updateSkeleton);
spendSlider?.addEventListener('input', updateRoiCalculator);

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLang = btn.dataset.lang;
    codeInput.value = SAMPLES[currentLang] || '';
    updateSkeleton();
  });
});

// PACKAGE MANAGER TABS
pkgTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    pkgTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const pkg = tab.dataset.pkg;
    if (pkg === 'npx') cliCommandText.textContent = 'npx context-skeleton scan';
    else if (pkg === 'bunx') cliCommandText.textContent = 'bunx context-skeleton scan';
    else if (pkg === 'pnpm') cliCommandText.textContent = 'pnpm dlx context-skeleton scan';
    else if (pkg === 'yarn') cliCommandText.textContent = 'yarn dlx context-skeleton scan';
  });
});

btnCopySkeleton?.addEventListener('click', () => {
  navigator.clipboard.writeText(codeOutput.value);
  btnCopySkeleton.innerHTML = `✓ Copied!`;
  setTimeout(() => {
    btnCopySkeleton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      Copy Skeletonized Context
    `;
  }, 2000);
});

btnCopyBadge?.addEventListener('click', () => {
  navigator.clipboard.writeText(badgeSnippet.textContent);
  btnCopyBadge.textContent = 'Copied!';
  setTimeout(() => { btnCopyBadge.textContent = 'Copy Badge'; }, 2000);
});

copyCliBtn?.addEventListener('click', () => {
  navigator.clipboard.writeText(cliCommandText.textContent);
  copyCliBtn.style.borderColor = '#00e676';
  setTimeout(() => { copyCliBtn.style.borderColor = ''; }, 2000);
});

// CHECKOUT MODAL HANDLERS
checkoutBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const plan = btn.dataset.plan;
    if (plan === 'pro') {
      modalPlanTitle.textContent = 'Subscribe to Pro Developer';
      modalPlanPrice.textContent = '$12.00 / month';
    } else if (plan === 'team') {
      modalPlanTitle.textContent = 'Subscribe to Team Plan';
      modalPlanPrice.textContent = '$49.00 / seat / month';
    }
    checkoutModal.classList.remove('hidden');
  });
});

closeModal?.addEventListener('click', () => {
  checkoutModal.classList.add('hidden');
});

checkoutModal?.addEventListener('click', (e) => {
  if (e.target === checkoutModal) {
    checkoutModal.classList.add('hidden');
  }
});
