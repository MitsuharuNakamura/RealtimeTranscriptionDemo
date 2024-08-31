const displayedData = new Set();

function scrollToBottom() {
  const container = document.getElementById('webhook-data-container');
  container.scrollTop = container.scrollHeight;
}

function addMessage(data) {
  console.log('Adding message:', data); // デバッグ用ログ
  const track = data.track;
  const dataString = data.transcript;
  const label = track === 'inbound_track' ? 'Inbound' : 'Outbound';
  
  //if (!displayedData.has(dataString)) {
    displayedData.add(dataString);

    const webhookDataContainer = document.getElementById('webhook-data-container');
    const newDataDiv = document.createElement('div');
    newDataDiv.className = `message ${track === 'inbound_track' ? 'inbound' : 'outbound'}`;
    newDataDiv.innerHTML = `<div class="label">${label}</div><div class="content">${dataString}</div>`;
    webhookDataContainer.appendChild(newDataDiv);

    scrollToBottom();
  //}
}

// Syncクライアントの初期化とドキュメントの監視
fetch('/token')
  .then(response => response.json())
  .then(data => {
    const syncClient = new Twilio.Sync.Client(data.token);
    
    syncClient.document('transcriptionData').then(doc => {
      console.log('Initial Sync data:', doc.data); // デバッグ用ログ
      // 初期データの表示
      if (doc.data && doc.data.transcript) {
        addMessage(doc.data);
      }

      // データの変更を監視
      doc.on('updated', event => {
        console.log('Sync document updated:', event.data); // デバッグ用ログ
        if (event.data && event.data.transcript) {
          addMessage(event.data);
        }
      });
    });
  })
  .catch(error => console.log('Error:', error));