# © 2020 Envision Digital. All Rights Reserved.

import json
import os
from websocket import create_connection
from enos_subscribe import DataClient

if __name__ == '__main__':
    dataClient = DataClient(host=os.getenv('SUBSCRIPTION_HOST'),
                            port=os.getenv('SUBSCRIPTION_PORT'),
                            access_key=os.getenv('APP_ACCESS_KEY'),
                            access_secret=os.getenv('APP_ACCESS_SECRET'))
    dataClient.subscribe(sub_id=os.getenv('SUBSCRIPTION_ID'))

    uri = 'ws://' + os.getenv('WEBSOCKET_URL') + ':' + \
        os.getenv('WEBSOCKET_PORT')
    ws = create_connection(uri)
    for message in dataClient:
        msg = json.loads(message)
        msg['type'] = 'timeseries'
        ws.send(json.dumps(msg))
