#!/usr/bin/with-contenv bashio

echo "Start Blockchain Connector!"

#variable
BOOTNODE_ADDRESS=$(bashio::config 'bootnode_address')
BOOTNODE_PORT=$(bashio::config 'bootnode_port')

#logging
echo "the bootnode address is => ${BOOTNODE_ADDRESS}"
echo "the bootnode port is => ${BOOTNODE_PORT}"
bashio::log.info "${BOOTNODE_ADDRESS}"
bashio::log.info "${BOOTNODE_PORT}"

bashio::log.info "Bootnode address for this app => : $(echo -n "${BOOTNODE_ADDRESS}")"
bashio::log.info "Bootnode address for this app => : $(echo -n "${BOOTNODE_PORT}")"

#execute main program
npm run ws-dev