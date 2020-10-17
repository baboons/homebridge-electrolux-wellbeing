# Homebridge integration for Electrolux Wellbeing

This is Electrolux Wellbeing plugin for [Homebridge](https://github.com/nfarina/homebridge). This plugin will add Electrolux Air Purifier with all it's sensor 
to your Home app. 

## Installation
`npm install -g homebridge-electrolux-wellbeing` or use Homebridge UI

## Configuration
Use Homebridge UI to configure 

## Client Secret
Electrolux uses a client secret to get a client token which is used while autheticating the user. 
The Client Secret is probably the same for all users with the app but I decided that the user has to add it for now. 
Hopefully the development team att Electrolux would allow us to share it.

### Getting the client secret
You need to use a proxy like [Charles](https://www.charlesproxy.com/) to intercept the traffic and get the client secret. If you ask me nicley on [Twitter](https://twitter.com/johantd04) on a DM I can share that. :-)

## How to use fan speed

Since Electrolux Air Purifier has 3 states, Off, Auto and Manual, changing the fan speed while in auto mode wont increase the fan until you go in to manual (which can be set on the accessory in Home app).   