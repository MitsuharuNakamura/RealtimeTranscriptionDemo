exports.handler = async function(context, event, callback) {
    const response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');

    const syncServiceSid = context.SYNC_SERVICE_SID;
    const syncDocumentName = context.SYNC_DOCUMENT_NAME;
    const client = context.getTwilioClient();
    client.timeout = 10000; // タイムアウトを30秒に設定

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

    function handleTranscriptionStarted(data) {
        console.log('Transcription started:', data);
    }

    function handleTranscriptionStopped(data) {
        console.log('Transcription stopped:', data);
    }

    function handleDefault(data) {
        console.log('想定外のデータを受信しました');
        console.log('Webhook received:', data);
    }

    const transcriptionEvent = event.TranscriptionEvent;

    try {
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