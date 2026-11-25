
const input = document.getElementById("identifiers");
const checkBtn = document.getElementById("checkBtn");
const results = document.getElementById("results");

const states = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CH: "Chandigarh",
  CG: "Chhattisgarh",
  DD: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JK: "Jammu and Kashmir",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OD: "Odisha",
  PB: "Punjab",
  PY: "Puducherry",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TS: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  WB: "West Bengal"
};

const companyTypes = {
  PTC: "Private Limited Company",
  PLC: "Public Limited Company",
  OPC: "One Person Company",
  GOI: "Government Company"
};

function validateIdentifier(value) {
  const id = value.trim().toUpperCase();

  if (!id) {
    return { valid: false, error: "Empty identifier" };
  }

  // LLPIN format: 3 letters, hyphen, 4 digits
  if (/^[A-Z]{3}-[0-9]{4}$/.test(id)) {
    return {
      valid: true,
      kind: "LLP",
      identifier: id,
      details: {
        type: "Limited Liability Partnership",
        note: "Format valid; MCA registration not verified"
      }
    };
  }

  if (id.includes("-")) {
    return {
      valid: false,
      error: "Invalid LLPIN format. Expected 3 letters followed by a hyphen and 4 digits."
    };
  }

  if (id.length !== 21) {
    return {
      valid: false,
      error: `CIN must contain exactly 21 characters. Found ${id.length}.`
    };
  }

  if (!/^[LU]/.test(id)) {
    return {
      valid: false,
      error: "First character must be L (Listed) or U (Unlisted)."
    };
  }

  if (!/^[0-9]{5}$/.test(id.slice(1, 6))) {
    return {
      valid: false,
      error: "Characters 2–6 must be a five-character industry code."
    };
  }

  const stateCode = id.slice(6, 8);

  if (!states[stateCode]) {
    return {
      valid: false,
      error: `Unknown state code: ${stateCode}.`
    };
  }

  if (!/^\d{4}$/.test(id.slice(8, 12))) {
    return {
      valid: false,
      error: "Characters 9–12 must be the four-digit incorporation year."
    };
  }

  const year = Number(id.slice(8, 12));

  if (year < 1850 || year > new Date().getFullYear()) {
    return {
      valid: false,
      error: `Incorporation year ${year} is outside the supported range.`
    };
  }

  const typeCode = id.slice(12, 15);

  if (!/^[A-Z]{3}$/.test(typeCode)) {
    return {
      valid: false,
      error: "Characters 13–15 must be a three-letter company category code."
    };
  }

  if (!/^\d{6}$/.test(id.slice(15, 21))) {
    return {
      valid: false,
      error: "Last six characters must be numeric."
    };
  }

  return {
    valid: true,
    kind: "Company",
    identifier: id,
    details: {
      listing: id[0] === "L" ? "Listed" : "Unlisted",
      industryCode: id.slice(1, 6),
      state: states[stateCode],
      year: year,
      type: companyTypes[typeCode] || `Other / Unknown (${typeCode})`,
      registrationNumber: id.slice(15, 21),
      note: "Format valid; MCA registration not verified"
    }
  };
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderResults() {
  const lines = input.value.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    results.innerHTML = "<p>Please enter at least one identifier.</p>";
    return;
  }

  if (lines.length > 500) {
    results.innerHTML = "<p>Please enter no more than 500 identifiers.</p>";
    return;
  }

  const output = lines.map(value => ({
    value,
    result: validateIdentifier(value)
  }));

  window.latestResults = output;

  const validCount = output.filter(x => x.result.valid).length;

  let html = `
    <h3>Validation Results</h3>
    <p>${validCount} valid · ${output.length - validCount} invalid</p>
  `;

  output.forEach(item => {
    const r = item.result;

    html += `<article class="result-card">
      <strong>${escapeHTML(item.value)}</strong>
      <span>${r.valid ? "✓ Format Valid" : "✕ Invalid"}</span>`;

    if (r.valid) {
      html += `<p>${escapeHTML(r.kind)}</p>`;

      Object.entries(r.details).forEach(([key, value]) => {
        html += `<p><b>${escapeHTML(key)}:</b> ${escapeHTML(value)}</p>`;
      });
    } else {
      html += `<p>${escapeHTML(r.error)}</p>`;
    }

    html += `</article>`;
  });

  results.innerHTML = html;
  results.appendChild(exportButton);
}

checkBtn.addEventListener("click", renderResults);


function exportCSV() {
  const rows = window.latestResults || [];

  if (!rows.length) {
    alert("Please validate identifiers first.");
    return;
  }

  const headers = [
    "Identifier",
    "Status",
    "Category",
    "Listing",
    "State",
    "Year",
    "Company Type",
    "Error"
  ];

  const csvRows = rows.map(({ value, result }) => {
    const d = result.details || {};

    return [
      value,
      result.valid ? "Format Valid" : "Invalid",
      result.kind || "",
      d.listing || "",
      d.state || "",
      d.year || "",
      d.type || "",
      result.error || ""
    ];
  });

  const escapeCSV = value =>
    '"' + String(value).replace(/"/g, '""') + '"';

  const csv = [headers, ...csvRows]
    .map(row => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "filesure-validation-results.csv";
  link.click();

  URL.revokeObjectURL(url);
}

const exportButton = document.createElement("button");
exportButton.textContent = "Download CSV ↓";
exportButton.style.background = "#16834a";
exportButton.style.marginTop = "12px";
exportButton.addEventListener("click", exportCSV);

