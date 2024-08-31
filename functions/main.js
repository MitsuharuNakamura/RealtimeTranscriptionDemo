exports.handler = async function(context, event, callback) {
    const response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');

    const syncServiceSid = context.SYNC_SERVICE_SID;
    const syncDocumentName = context.SYNC_DOCUMENT_NAME;
    const client = context.getTwilioClient();
    client.timeout = 10000; // タイムアウトを１0秒に設定

    // Syncドキュメントを更新する関数
    async function updateSyncDocument(data, retries = 3) {
        try {
            await client.sync.v1.services(syncServiceSid)
                .documents(syncDocumentName)
                .update({
                    data: {
                        transcript: data.transcript,
                        track: data.track
                    }
                });
            console.log('Sync document updated');
        } catch (err) {
            if (retries > 0) {
                console.log(`Retrying Sync update. Attempts left: ${retries - 1}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return updateSyncDocument(data, retries - 1);
            }
            throw err;
        }
    }

    // 文字起こしの内容を処理する関数
    async function handleTranscriptionContent(data) {
        console.log('Transcription content:', data);
        const transcriptionData = data.TranscriptionData ? JSON.parse(data.TranscriptionData) : null;
        if (transcriptionData && transcriptionData.transcript) {
            const confidence = transcriptionData.confidence;    
            if (confidence >= 0.4) {
                var tracklabel = data.Track;
                try {
                    await updateSyncDocument({
                        transcript: transcriptionData.transcript,
                        track: tracklabel
                    });
                } catch (err) {
                    console.error('Error updating Sync document:', err);
                    console.error('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
                }
            }
        }
    }
    // 文字起こしが開始されたときの処理
    function handleTranscriptionStarted(data) {
        console.log('Transcription started:', data);
    }
    // 文字起こしが停止されたときの処理
    function handleTranscriptionStopped(data) {
        console.log('Transcription stopped:', data);
    }
    // 想定外のデータを受信したときの処理
    function handleDefault(data) {
        console.log('想定外のデータを受信しました');
        console.log('Webhook received:', data);
    }

    const transcriptionEvent = event.TranscriptionEvent;

    try {
        // イベントに応じた処理を実行
        if (transcriptionEvent === 'transcription-started') {
            handleTranscriptionStarted(event);
        } else if (transcriptionEvent === 'transcription-content') {
            await handleTranscriptionContent(event);
        } else if (transcriptionEvent === 'transcription-stopped') {
            handleTranscriptionStopped(event);
        } else {
            handleDefault(event);
        }

        response.setBody({ message: 'Webhook received' });
        return callback(null, response);
    } catch (err) {
        console.error('Error in webhook handler:', err);
        response.setStatusCode(500);
        response.setBody({ error: 'Internal server error' });
        return callback(null, response);
    }
};