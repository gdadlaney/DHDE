#!/bin/bash

composer network install --card PeerAdmin@hlfv1 --archiveFile ccda-transfer.bna
composer network start --networkName ccda-transfer --networkVersion 0.0.16-deploy.0 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card
composer card import --file networkadmin.card
composer network ping --card admin@ccda-transfer
composer-rest-server -c admin@ccda-transfer -n never -u true -d password -w true
