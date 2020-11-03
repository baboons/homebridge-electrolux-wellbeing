# Homebridge integration for Electrolux Wellbeing

This is the Electrolux Wellbeing plugin for [Homebridge](https://github.com/nfarina/homebridge). This plugin will add support for Electrolux Air Purifier with all it's sensors (Air Quality, Temperature, Humidity, CO2 and Light) 
to your Home app. 

## Installation
`npm install -g homebridge-electrolux-wellbeing` or use Homebridge UI

## Configuration
Use Homebridge UI to configure and set your username and password.

### Ionizer
Currently, there is no support for ionizer in HomeKit, so we mapped this to Swing Mode instead. 
Use oscilliator/swing mode to control ionizer on/off.