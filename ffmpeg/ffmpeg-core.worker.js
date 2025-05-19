
// This is a minimal FFmpeg worker stub
self.onmessage = function(e) {
  console.log('FFmpeg worker received message:', e.data);
  if (e.data.type === 'init') {
    self.postMessage({ type: 'ready' });
  } else {
    self.postMessage({ type: 'error', message: 'FFmpeg worker stub - command not supported' });
  }
};
