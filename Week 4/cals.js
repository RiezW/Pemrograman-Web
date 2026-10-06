function kalkulator(a, b, operator) {
  if (operator === "/" && b === 0) {
    return "Error: Pembagian dengan 0 tidak diperbolehkan!";
  }

  if (operator === "+") return a + b;
  else if (operator === "-") return a - b;
  else if (operator === "*") return a * b;
  else if (operator === "/") return a / b;
  else return "Error: Operator tidak valid";
}

document.addEventListener("DOMContentLoaded", function () {
  const display = document.querySelector(".display input");
  const keypad = document.querySelector(".keypad_container");
  let angkaPertama;
  let operator;
  let hasilBaru = false;

  keypad.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;

    const value = button.textContent.trim();

    if (!isNaN(value)) {
      display.value = hasilBaru ? value : display.value + value;
      hasilBaru = false;
      return;
    }

    if (["+", "-", "*", "/"].includes(value)) {
      if (!display.value || operator || display.value.startsWith("Error:")) return;
      angkaPertama = Number(display.value);
      operator = value;
      display.value = "";
      return;
    }

    if (value === "=" && operator && display.value) {
      display.value = String(kalkulator(angkaPertama, Number(display.value), operator));
      operator = null;
      hasilBaru = true;
    }
  });
});