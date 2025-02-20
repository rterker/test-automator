const queue = [];

//when you are done running, call next: next is a method that will dequeue and call the next in line
//probably need to pass args to queue[0]()
export function next() {
  queue.shift();
  const nextFunc = queue[0];
  if (nextFunc) nextFunc();
}

export function start() {
  queue[0]();
}

export function pushToQueue(...funcs) {
  queue.push(...funcs);
}

export function getQueueLength() {
  return queue.length;
}