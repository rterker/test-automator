let controlWindowId;
let controlWindowFocus = false;

export function setControlWindowId(id) {
  controlWindowId = id;
  return controlWindowId;
}

export function getControlWindowId() {
  return controlWindowId;
}

export function setControlWindowFocus(status) {
  controlWindowFocus = status;
}

export function getControlWindowFocus() {
  return controlWindowFocus;
}