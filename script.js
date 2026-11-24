"use strict";

const FUNCTION_NAMES = [
  "arcsen", "arcsin", "arccos", "arctan",
  "sqrt", "cbrt", "sen", "sin", "cos", "tan",
  "abs", "exp", "ln", "log", "pi", "e", "x"
];

const FUNCTIONS = {
  arcsen: Math.asin,
  arcsin: Math.asin,
  arccos: Math.acos,
  arctan: Math.atan,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  sen: Math.sin,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  abs: Math.abs,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10
};

const EXAMPLES = [
  ["(x^2-4)/(x-2)", "2"],
  ["(sqrt(x)-3)/(x-9)", "9"],
  ["sen(5x)/x", "0"],
  ["(2x+5)/(x-3)", "3"],
  ["(3x^2+2x)/(5x^2-7)", "inf"],
  ["(1+3/x)^(3x)", "inf"],
  ["(1-cos(x))/x^2", "0"]
];

function tokenize(expression) {
  let normalized = expression
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/[−–]/g, "-")
    .replace(/[×·]/g, "*")
    .replace(/\[/g, "(")
    .replace(/\]/g, ")");

  if (!normalized) {
    throw new Error("Digite uma função.");
  }

  const tokens = [];
  let position = 0;

  while (position < normalized.length) {
    const remainder = normalized.slice(position);
    const numberMatch = remainder.match(/^(\d+\.?\d*|\.\d+)/);

    if (numberMatch) {
      tokens.push({ number: Number(numberMatch[0]) });
      position += numberMatch[0].length;
      continue;
    }

    if (/^[+\-*/^()]/.test(remainder)) {
      tokens.push({ operator: remainder[0] });
      position++;
      continue;
    }

    const name = FUNCTION_NAMES.find(item => remainder.startsWith(item));
    if (!name) {
      throw new Error(`Símbolo não reconhecido perto de “${remainder.slice(0, 3)}”.`);
    }

    tokens.push({ name });
    position += name.length;
  }

  return tokens;
}

function parse(expression) {
  const tokens = tokenize(expression);
  let position = 0;

  const currentToken = () => tokens[position];

  const canStartImplicitMultiplication = token =>
    token &&
    (token.number !== undefined || token.name || token.operator === "(");

  function parseExpression() {
    let left = parseTerm();

    while (currentToken()?.operator === "+" || currentToken()?.operator === "-") {
      const operator = tokens[position++].operator;
      const right = parseTerm();
      const previous = left;

      left = operator === "+"
        ? x => previous(x) + right(x)
        : x => previous(x) - right(x);
    }

    return left;
  }

  function parseTerm() {
    let left = parseUnary();

    while (true) {
      const token = currentToken();

      if (token?.operator === "*" || token?.operator === "/") {
        position++;
        const right = parseUnary();
        const previous = left;
        left = token.operator === "*"
          ? x => previous(x) * right(x)
          : x => previous(x) / right(x);
      } else if (canStartImplicitMultiplication(token)) {
        const right = parseUnary();
        const previous = left;
        left = x => previous(x) * right(x);
      } else {
        return left;
      }
    }
  }

  function parseUnary() {
    const token = currentToken();

    if (token?.operator === "-") {
      position++;
      const operand = parseUnary();
      return x => -operand(x);
    }

    if (token?.operator === "+") {
      position++;
      return parseUnary();
    }

    return parsePower();
  }

  function parsePower() {
    const base = parseAtom();

    if (currentToken()?.operator === "^") {
      position++;
      const exponent = parseUnary();
      return x => Math.pow(base(x), exponent(x));
    }

    return base;
  }

  function parseAtom() {
    const token = tokens[position++];
    if (!token) {
      throw new Error("Expressão incompleta.");
    }

    if (token.number !== undefined) {
      return () => token.number;
    }

    if (token.operator === "(") {
      const value = parseExpression();
      if (currentToken()?.operator !== ")") {
        throw new Error("Faltou fechar um parêntese.");
      }
      position++;
      return value;
    }

    if (token.name === "x") return x => x;
    if (token.name === "pi") return () => Math.PI;
    if (token.name === "e") return () => Math.E;

    if (token.name) {
      const fn = FUNCTIONS[token.name];
      const argument = parseAtom();
      return x => fn(argument(x));
    }

    throw new Error("Expressão inválida.");
  }

  const value = parseExpression();

  if (position < tokens.length) {
    throw new Error("Expressão inválida (verifique os parênteses e operadores).");
  }

  return value;
}

function parsePoint(text) {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, "");

  if (/^\+?(inf|infinito|oo|∞)$/.test(normalized)) return Infinity;
  if (/^[-−](inf|infinito|oo|∞)$/.test(normalized)) return -Infinity;

  const value = parse(normalized)(0);
  if (!Number.isFinite(value)) {
    throw new Error("Ponto inválido.");
  }

  return value;
}

function evaluateSafely(fn, x) {
  try {
    const value = fn(x);
    return typeof value === "number" ? value : NaN;
  } catch {
    return NaN;
  }
}

function evaluateSide(fn, point, direction) {
  let points;

  if (!Number.isFinite(point)) {
    const sign = point > 0 ? 1 : -1;
    if (direction !== sign) return null;

    points = [1e2, 1e3, 1e4, 1e5, 1e6]
      .map(distance => ({ x: sign * distance }));
  } else {
    points = [1e-1, 1e-2, 1e-3, 1e-4, 1e-5]
      .map(distance => ({ x: point + direction * distance }));
  }

  points.forEach(item => {
    item.y = evaluateSafely(fn, item.x);
  });

  const penultimate = points[3].y;
  const closest = points[4].y;
  const result = { points, kind: "osc", value: null };

  if (Number.isNaN(penultimate) || Number.isNaN(closest)) {
    result.kind = "nan";
    return result;
  }

  if (
    Math.abs(closest - penultimate) <=
      1e-3 * Math.max(1, Math.abs(closest)) &&
    Number.isFinite(closest)
  ) {
    result.kind = "num";
    result.value = closest;
    return result;
  }

  if (
    Math.abs(closest) > Math.abs(penultimate) * 1.2 &&
    Math.abs(closest) > 8 &&
    Math.sign(penultimate) === Math.sign(closest)
  ) {
    result.kind = "inf";
    result.value = Math.sign(closest) * Infinity;
  }

  return result;
}

function formatNumber(value) {
  if (value === Infinity) return "+∞";
  if (value === -Infinity) return "−∞";
  if (Number.isNaN(value)) return "indef.";

  return String(Number(value.toPrecision(7)))
    .replace(".", ",")
    .replace("-", "−");
}

function formatLimit(value) {
  if (!Number.isFinite(value)) return formatNumber(value);

  const decimal = formatNumber(Math.abs(value) < 1e-9 ? 0 : value);
  const rounded = Math.round(value);

  if (Math.abs(value - rounded) < 1e-4) {
    return String(rounded).replace("-", "−");
  }

  for (let exponent = -12; exponent <= 12; exponent++) {
    const exponential = Math.exp(exponent);
    if (
      exponent &&
      Math.abs(value - exponential) < 1e-3 * Math.max(1, exponential)
    ) {
      return exponent === 1
        ? `e ≈ ${decimal}`
        : `e^${String(exponent).replace("-", "−")} ≈ ${decimal}`;
    }
  }

  for (let denominator = 2; denominator <= 60; denominator++) {
    const numerator = Math.round(value * denominator);
    if (
      numerator &&
      Math.abs(value - numerator / denominator) < 1e-5
    ) {
      const sign = numerator < 0 ? "−" : "";
      return `${sign}${Math.abs(numerator)}/${denominator} ≈ ${decimal}`;
    }
  }

  return decimal;
}

function formatSide(side, label) {
  if (!side) return "";

  const text = {
    num: formatLimit(side.value),
    inf: formatNumber(side.value),
    nan: "não definida perto de a",
    osc: "não converge (oscila)"
  }[side.kind];

  return `${label} ${text}`;
}

let state = null;
const getElement = id => document.getElementById(id);

function getSideValue(side) {
  if (!side) return null;
  if (side.kind === "num") return side.value;
  if (side.kind === "inf") return side.value;
  return null;
}

function calculateResult(leftSide, rightSide) {
  const sides = [leftSide, rightSide].filter(Boolean);

  if (sides.some(side => side.kind === "nan")) {
    return { type: "undef" };
  }

  if (sides.some(side => getSideValue(side) === null)) {
    return { type: "dne", reason: "o valor não converge para um único número" };
  }

  if (sides.length === 1) {
    const side = sides[0];
    return side.kind === "num"
      ? { type: "ok", value: side.value }
      : { type: "inf", value: side.value };
  }

  const leftValue = getSideValue(leftSide);
  const rightValue = getSideValue(rightSide);

  if (
    Number.isFinite(leftValue) &&
    Number.isFinite(rightValue) &&
    Math.abs(leftValue - rightValue) <=
      1e-3 * Math.max(1, Math.abs(rightValue))
  ) {
    return { type: "ok", value: rightValue };
  }

  if (
    !Number.isFinite(leftValue) &&
    leftValue === rightValue
  ) {
    return { type: "inf", value: rightValue };
  }

  return { type: "dne", reason: "os limites laterais são diferentes" };
}

function createHints(fn, point, result) {
  const hints = [];

  if (!Number.isFinite(point)) {
    hints.push(
      "Em x → ∞, para polinômios e frações de polinômios, divida todos os termos pelo termo de maior grau."
    );

    if (result.type === "ok" && Math.abs(result.value) > 1e-9) {
      hints.push(
        `A reta y = ${formatLimit(result.value)} é uma assíntota horizontal do gráfico.`
      );
    }

    return hints;
  }

  const functionAtPoint = evaluateSafely(fn, point);

  if (Number.isFinite(functionAtPoint)) {
    if (
      result.type === "ok" &&
      Math.abs(functionAtPoint - result.value) <=
        1e-3 * Math.max(1, Math.abs(functionAtPoint))
    ) {
      hints.push(
        `Substituição direta funciona: f(${formatNumber(point)}) = ${formatLimit(functionAtPoint)} (função contínua no ponto).`
      );
    } else {
      hints.push(
        `f(${formatNumber(point)}) = ${formatLimit(functionAtPoint)}, mas o limite é diferente: a função tem uma descontinuidade em x = ${formatNumber(point)}.`
      );
    }
  } else if (Math.abs(functionAtPoint) === Infinity) {
    hints.push(
      `Substituindo x = ${formatNumber(point)} aparece algo como k/0: analise os limites laterais. Pode haver assíntota vertical em x = ${formatNumber(point)}.`
    );
  } else if (result.type !== "undef") {
    hints.push(
      `Substituindo x = ${formatNumber(point)} surge uma indeterminação (como 0/0). Tente fatoração, racionalização, limites fundamentais ou L’Hôpital.`
    );
  }

  return hints;
}

function renderTable(side, title) {
  if (!side) return;

  const table = document.createElement("table");
  table.innerHTML = "<tr><th></th><th>x</th><th>f(x)</th></tr>";

  side.points.forEach(point => {
    const row = table.insertRow();
    row.insertCell();
    row.insertCell().textContent = formatNumber(point.x);
    row.insertCell().textContent = formatNumber(point.y);
  });

  const caption = document.createElement("div");
  caption.className = "muted";
  caption.style.marginBottom = "4px";
  caption.textContent = title;

  const tableGroup = document.createElement("div");
  tableGroup.append(caption, table);
  getElement("tbls").append(tableGroup);
}

function runCalculation() {
  getElement("err").textContent = "";

  let fn;
  let point;

  try {
    fn = parse(getElement("fx").value);
    point = parsePoint(getElement("pt").value);
  } catch (error) {
    getElement("err").textContent = error.message;
    return;
  }

  const leftSide = evaluateSide(fn, point, -1);
  const rightSide = evaluateSide(fn, point, 1);
  const result = calculateResult(leftSide, rightSide);
  const pointText = point === Infinity
    ? "+∞"
    : point === -Infinity
      ? "−∞"
      : formatNumber(point);

  const heading = `lim (x → ${pointText}) f(x) = `;
  const resultElement = getElement("big");
  resultElement.className = "big";

  if (result.type === "ok") {
    resultElement.textContent = heading + formatLimit(result.value);
    resultElement.classList.add("ok");
  } else if (result.type === "inf") {
    resultElement.textContent = heading + formatNumber(result.value);
    resultElement.classList.add("ok");
  } else if (result.type === "dne") {
    resultElement.textContent = `O limite não existe (${result.reason})`;
    resultElement.classList.add("dne");
  } else {
    resultElement.textContent =
      `A função não está definida nas proximidades de ${pointText}.`;
  }

  if (Number.isFinite(point)) {
    getElement("sides").textContent = [
      formatSide(leftSide, `Pela esquerda (x → ${pointText}⁻):`),
      formatSide(rightSide, `Pela direita (x → ${pointText}⁺):`)
    ].join("  ·  ");
  } else {
    getElement("sides").textContent = "";
  }

  const hints = createHints(fn, point, result);
  const hintsElement = getElement("hints");
  hintsElement.innerHTML = "";

  hints.forEach(text => {
    const item = document.createElement("li");
    item.textContent = text;
    hintsElement.appendChild(item);
  });

  getElement("res").hidden = false;
  getElement("gcard").hidden = false;
  getElement("tcard").hidden = false;

  const tablesElement = getElement("tbls");
  tablesElement.innerHTML = "";

  if (Number.isFinite(point)) {
    renderTable(leftSide, `x se aproxima de ${pointText} pela esquerda`);
    renderTable(rightSide, `x se aproxima de ${pointText} pela direita`);
  } else {
    renderTable(
      point > 0 ? rightSide : leftSide,
      point > 0 ? "x cresce sem limite" : "x decresce sem limite"
    );
  }

  state = { fn, point, result };
  drawGraph();
}

function drawGraph() {
  const canvas = getElement("cv");
  if (!canvas || !state) return;

  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;

  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const styles = getComputedStyle(document.documentElement);
  const color = name => styles.getPropertyValue(name).trim();
  const { fn, point, result } = state;

  let xMinimum;
  let xMaximum;

  if (Number.isFinite(point)) {
    xMinimum = point - 5;
    xMaximum = point + 5;
  } else if (point > 0) {
    xMinimum = -5;
    xMaximum = 45;
  } else {
    xMinimum = -45;
    xMaximum = 5;
  }

  const sampleCount = 800;
  const samples = [];
  const finiteValues = [];

  for (let index = 0; index <= sampleCount; index++) {
    const x =
      xMinimum + (xMaximum - xMinimum) * index / sampleCount;
    const y = evaluateSafely(fn, x);
    samples.push([x, y]);
    if (Number.isFinite(y)) finiteValues.push(y);
  }

  finiteValues.sort((a, b) => a - b);

  let yMinimum = finiteValues.length
    ? finiteValues[Math.floor(finiteValues.length * 0.04)]
    : -5;
  let yMaximum = finiteValues.length
    ? finiteValues[Math.floor(finiteValues.length * 0.96)]
    : 5;

  if (result.type === "ok") {
    yMinimum = Math.min(yMinimum, result.value);
    yMaximum = Math.max(yMaximum, result.value);
  }

  if (yMaximum - yMinimum < 1e-6) {
    yMinimum -= 1;
    yMaximum += 1;
  }

  const padding = (yMaximum - yMinimum) * 0.15;
  yMinimum -= padding;
  yMaximum += padding;

  const toCanvasX = x =>
    (x - xMinimum) / (xMaximum - xMinimum) * width;
  const toCanvasY = y =>
    height - (y - yMinimum) / (yMaximum - yMinimum) * height;

  context.lineWidth = 1;
  context.strokeStyle = color("--bd");
  context.fillStyle = color("--mu");
  context.font = "11px system-ui, sans-serif";
  context.beginPath();

  if (xMinimum < 0 && xMaximum > 0) {
    context.moveTo(toCanvasX(0), 0);
    context.lineTo(toCanvasX(0), height);
  }

  if (yMinimum < 0 && yMaximum > 0) {
    context.moveTo(0, toCanvasY(0));
    context.lineTo(width, toCanvasY(0));
  }

  context.stroke();

  context.fillText(formatNumber(xMinimum), 4, height - 4);
  context.textAlign = "right";
  context.fillText(formatNumber(xMaximum), width - 4, height - 4);
  context.fillText(formatNumber(yMaximum), width - 4, 12);
  context.fillText(formatNumber(yMinimum), width - 4, height - 16);
  context.textAlign = "left";

  context.save();
  context.setLineDash([5, 4]);
  context.strokeStyle = color("--mu");
  context.beginPath();

  if (Number.isFinite(point)) {
    context.moveTo(toCanvasX(point), 0);
    context.lineTo(toCanvasX(point), height);
  }

  if (result.type === "ok") {
    context.moveTo(0, toCanvasY(result.value));
    context.lineTo(width, toCanvasY(result.value));
  }

  context.stroke();
  context.restore();

  context.save();
  context.beginPath();
  context.rect(0, 0, width, height);
  context.clip();
  context.strokeStyle = color("--ac");
  context.lineWidth = 2.2;
  context.beginPath();

  let previousY = null;

  for (const [x, y] of samples) {
    if (!Number.isFinite(y)) {
      previousY = null;
      continue;
    }

    if (
      previousY === null ||
      Math.abs(y - previousY) > (yMaximum - yMinimum) * 1.5
    ) {
      context.moveTo(toCanvasX(x), toCanvasY(y));
    } else {
      context.lineTo(toCanvasX(x), toCanvasY(y));
    }

    previousY = y;
  }

  context.stroke();
  context.restore();

  if (Number.isFinite(point) && result.type === "ok") {
    context.fillStyle = color("--card");
    context.strokeStyle = color("--ok");
    context.lineWidth = 2.2;
    context.beginPath();
    context.arc(
      toCanvasX(point),
      toCanvasY(result.value),
      5,
      0,
      7
    );
    context.fill();
    context.stroke();
  }
}

function initializeExamples() {
  EXAMPLES.forEach(([expression, point]) => {
    const button = document.createElement("button");
    button.textContent = `lim ${expression} → ${point}`;
    button.onclick = () => {
      getElement("fx").value = expression;
      getElement("pt").value = point;
      runCalculation();
    };
    getElement("chips").appendChild(button);
  });
}

getElement("go").onclick = runCalculation;

["fx", "pt"].forEach(id => {
  getElement(id).addEventListener("keydown", event => {
    if (event.key === "Enter") runCalculation();
  });
});

window.addEventListener("resize", drawGraph);

try {
  window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => setTimeout(drawGraph, 50));
} catch {
  // Navegadores antigos podem não oferecer o evento.
}

initializeExamples();
runCalculation();
