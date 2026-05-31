const pad = (n) => String(n).padStart(2, "0");

export function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function log(level, message, details) {
  const line = details
    ? `${timestamp()} [${level}] ${message} ${JSON.stringify(details)}`
    : `${timestamp()} [${level}] ${message}`;
  if (level === "ERROR") console.error(line);
  else console.log(line);
}

export function info(message, details) {
  log("INFO", message, details);
}

export function error(message, details) {
  log("ERROR", message, details);
}
