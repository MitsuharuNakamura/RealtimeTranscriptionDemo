# 音声リアルタイム文字起こしのサーバーレス用コード  
## 前提  

### 条件  
1. Twilioのアカウントを持っていること
2. Twilio CLIが利用可能なこと
3. Twilio CLIのServerlessプラグインが導入済みであること
4. SyncのDocumentの設定が完了していること
5. Twilio上で利用可能な電話番号があること

### 手順概要  
1. .envファイルへ必要な変数の登録  
   - Account SID
   - Auth_Token
   - SYNC_SERVICE_SID  
   - SYNC_DOCUMENT_NAME  
  
2. index.htmlコード内の下記にある「transcriptionData」という名称をあなたが作成したSYNCのDocumentの名称に変更してから利用して下さい。
`syncClient.document('transcriptionData').then(doc => {`  
`    console.log('Initial Sync data:', doc.data); // デバッグ用ログ`  
`    // 初期データの表示`  
`    if (doc.data && doc.data.transcript) {`  
`    addMessage(doc.data);`  
`}`  

##  ローカル環境での実行
1. ローカル実行  
`npm start`  
  
## 本番環境へのデプロイ
1. プロファイルの確認  
`twilio profiles:list`  
2. プロファイルの切り替え  
`twilio profiles:use jp-proj`  
3. デプロイ  
`twilio serverless:deploy`  
