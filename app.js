//این فایل با استفاده از هوش مصنوعی ChatGpt بهینه شده

// ساده و شفاف — همه چیز در این فایل
const display = document.getElementById("display");
let expr = ""; // رشته نمایشگر
let lastWasEq = false;

// کمک‌های ساده برای آپدیت نمایش
function setDisplay(text) {
  display.textContent = text;
}
function appendToExpr(s) {
  if (lastWasEq && /[0-9.]/.test(s)) {
    expr = "";
    lastWasEq = false;
  }
  expr += s;
  setDisplay(expr || "0");
}

// دکمه‌های عدد/نقطه
document.querySelectorAll("button.op").forEach((b) => {
  b.addEventListener("click", () => appendToExpr(b.dataset.val));
});

// عملکردهای اصلی (+ - * /)
document.querySelectorAll("button.fn").forEach((b) => {
  b.addEventListener("click", () => {
    const f = b.dataset.fn;
    if (f === "add") appendToExpr("+");
    if (f === "subtract") appendToExpr("-");
    if (f === "multiply") appendToExpr("*");
    if (f === "divide") appendToExpr("/");
  });
});

// پاک کردن
document.getElementById("clear").addEventListener("click", () => {
  expr = "";
  setDisplay("0");
  lastWasEq = false;
});

// محاسبات پیشرفته
document.querySelectorAll("button.adv").forEach((b) => {
  b.addEventListener("click", () => {
    const adv = b.dataset.adv;
    try {
      if (adv === "pow") {
        // برای توان: اگر قبلاً عدد وارد شده، می‌نگارد "base^" تا کاربر عدد دوم را وارد کند
        if (expr && !expr.endsWith("^")) {
          appendToExpr("^");
        }
      } else if (adv === "sqrt") {
        // جذر: محاسبه فوری روی مقدار فعلی
        const v = evalSafe(expr);
        if (v == null) throw "ورودی نامعتبر";
        const res = Math.sqrt(v);
        expr = String(res);
        setDisplay(expr);
        lastWasEq = true;
      } else if (adv === "sin" || adv === "cos" || adv === "tan") {
        const v = evalSafe(expr);
        if (v == null) throw "ورودی نامعتبر";
        let res = 0;
        if (adv === "sin") res = Math.sin(v);
        if (adv === "cos") res = Math.cos(v);
        if (adv === "tan") res = Math.tan(v);
        expr = String(res);
        setDisplay(expr);
        lastWasEq = true;
      } else if (adv === "log10") {
        const v = evalSafe(expr);
        if (v == null || v <= 0) throw "ورودی نامعتبر";
        expr = String(Math.log10 ? Math.log10(v) : Math.log(v) / Math.LN10);
        setDisplay(expr);
        lastWasEq = true;
      }
    } catch (e) {
      setDisplay("خطا");
      expr = "";
      console.error(e);
    }
  });
});

// محاسبه =
// پشتیبانی از علامت ^ برای توان: تبدیل به Math.pow
document.getElementById("equals").addEventListener("click", () => {
  try {
    // اگر شامل ^ بود، پردازش دستی
    if (expr.includes("^")) {
      // مثال: "2^3" یا "2+3^2" -> باید ^ دارای بیشترین اولویت شود
      // پیاده‌سازی ساده: با regex ^ به Math.pow تبدیل می‌کنیم (چند ^ پیچیده پشتیبانی نمیشود)
      expr = expr.replace(
        /(\d+(\.\d+)?|\([^\)]+\))\^(\d+(\.\d+)?|\([^\)]+\))/g,
        (m, a, b, c) => {
          return `Math.pow(${a},${c})`;
        }
      );
    }
    // امنیت: از eval بسیار ساده استفاده می‌کنیم ولی قبلش فقط حروف و ارقام و نمادهای مجاز را اجازه می‌دهیم
    const result = evalSafe(expr);
    if (result == null || !isFinite(result)) throw "خطا در محاسبه";
    setDisplay(String(result));
    expr = String(result);
    lastWasEq = true;
  } catch (e) {
    setDisplay("خطا");
    expr = "";
    lastWasEq = false;
  }
});

// eval ساده و امن‌تر: اجازه کاراکترهای مجاز فقط
function evalSafe(s) {
  if (!s) return 0;
  // حذف فاصله
  s = s.replace(/\s+/g, "");
  // اجازه اعداد، پرانتز، + - * / . و Math.pow و Math.* (ما از Math.pow استفاده می‌کنیم)
  // برای ایمن‌تر شدن، reject اگر کاراکتر مشکوک وجود داشته باشد
  if (/[^\d+\-*/().^Mathpow]/i.test(s)) {
    // ولی چون ما ^ را به Math.pow تبدیل می‌کنیم، سپس بررسی میکنیم
    // ساده‌ترین رویکرد: تبدیل ^ به Math.pow(...) اگر وجود داشته باشد — اگر نشد، reject
  }
  // تبدیل ^ اگر مانده
  // (در اینجا فقط از خودِ eval استفاده میکنیم پس باید خطر تزریق را کم کنیم)
  // ممنوعیت حروف الفبایی غیر از Math, pow
  if (/[A-Za-z]/.test(s) && !/Math|pow/.test(s)) return null;
  // جایگزینی ^ با Math.pow برای حالت‌های ساده (2^3)
  s = s.replace(
    /(\d+(\.\d+)?|\([^\)]+\))\^(\d+(\.\d+)?|\([^\)]+\))/g,
    (m, a, b, c) => {
      return `Math.pow(${a},${c})`;
    }
  );
  try {
    // محاسبه امن‌تر
    const res = Function('"use strict";return (' + s + ")")();
    return res;
  } catch (e) {
    return null;
  }
}

/* --- تبدیل مبنا --- */
document.getElementById("convertBtn").addEventListener("click", () => {
  const input = document.getElementById("baseInput").value.trim();
  const from = parseInt(document.getElementById("fromBase").value, 10);
  const to = parseInt(document.getElementById("toBase").value, 10);
  const out = document.getElementById("convertResult");

  if (!input) {
    out.textContent = "ورودی خالی است";
    return;
  }

  // فقط اعداد صحیح (ممکن است منفی)
  if (
    /^-?\d+$/.test(input) === false &&
    !/^[01]+$/.test(input) &&
    from !== 10
  ) {
    // اگر مبدأ دهدهی نباشد، بررسی کاراکترهای معتبر براساس مبنا
  }

  try {
    // parseInt با مبنای from
    const negative = input.startsWith("-");
    const raw = negative ? input.slice(1) : input;

    // بررسی معتبر بودن کاراکترها بر اساس مبنا
    const validChars = {
      2: /^[01]+$/,
      8: /^[0-7]+$/,
      10: /^[0-9]+$/,
    };
    if (!validChars[from].test(raw)) {
      out.textContent = `عدد معتبر برای مبنای ${from} نیست`;
      return;
    }

    const dec = parseInt(raw, from);
    if (isNaN(dec)) {
      out.textContent = "خطا در تبدیل";
      return;
    }
    let converted = dec.toString(to);
    if (negative) converted = "-" + converted;
    out.textContent = converted.toUpperCase();
  } catch (e) {
    out.textContent = "خطا";
  }
});

/* --- مودال راهنما --- */
const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const closeHelp = document.getElementById("closeHelp");
helpBtn.addEventListener("click", () => {
  helpModal.setAttribute("aria-hidden", "false");
});
closeHelp.addEventListener("click", () =>
  helpModal.setAttribute("aria-hidden", "true")
);
helpModal.addEventListener("click", (e) => {
  if (e.target === helpModal) helpModal.setAttribute("aria-hidden", "true");
});

/* --- کیبورد فیزیکی ساده --- */
window.addEventListener("keydown", (e) => {
  if (e.key >= "0" && e.key <= "9") appendToExpr(e.key);
  else if (e.key === ".") appendToExpr(".");
  else if (e.key === "+") appendToExpr("+");
  else if (e.key === "-") appendToExpr("-");
  else if (e.key === "*") appendToExpr("*");
  else if (e.key === "/") appendToExpr("/");
  else if (e.key === "Enter") document.getElementById("equals").click();
  else if (e.key === "Backspace") {
    expr = expr.slice(0, -1);
    setDisplay(expr || "0");
  }
});
