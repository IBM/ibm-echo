<!-- This should be the location of the title of the repository, normally the short name -->
# IBM ECHO
IBM ECHO is a API Requestor which refers to a component or entity within a software system that sends requests to an API in order to retrieve data or perform actions. In client-server architecture or distributed systems, the API requestor is usually the client application or service that initiates communication with the API. ECHO sends HTTP requests to specific endpoints defined by the API, specifying the desired operation (e.g., fetching data, updating resources) along with any required parameters or authentication credentials. Upon receiving the request, the API processes it, performs the necessary operations, and returns a response containing the requested data or indicating the outcome of the action.

## Features
- [x]  Testing API endpoint with all methods - GET, PUT, POST, DELETE, etc.
- [x]  Displays API response time along with response byte size and response headers.
- [x]  Save APIs at collections, sub-group level.
- [x]  Import collections from Postman and Insomnia.
- [x]  Export entire collections or their individual subfolders to allow collaboration among users with or without header values for added security.
- [x]  Add and configure Client SSL certificates to ensure seamless integration with APIs.
- [x]  API Chaining - now run APIs sequentially with the ability to pass on real-time responses and other data to subsequent APIs in the chain. An excellent feature to perform integration tests, run dependent APIs and more!
- [x]  Echo can be run on your favourite browser or on your personal computer as a desktop app.
- [x]  Unlike other REST API clients in the market, Echo desktop app works just as great in offline mode, too!

## How it works
- There are two parts to the application - Backend & Frontend.
- Backend is responsible for proxying of all endpoint that are to be tested through UI.
- Why do we need proxy? Proxy is needed since certain APIs that have a CORS response header set with allowed origins cannot be called via client.
- Frontend is responsible for showing the requester UI.

## Dependencies & libraries used (Mainly)
- Node 20
- ExpressJs 4.17.2
- Vite 4.4.5
- passport 0.6.0
- @carbon/react 1.14.0
- react 18.2.0
- Electron 28.1.0

Other dependencies can be found below - 
- [Client](https://github.ibm.com/Project-X/ECHO/blob/main/package.json)
- [Server](https://github.ibm.com/Project-X/ECHO/blob/main/server/package.json)


## Steps to run locally
- Install nvm - [installation guide](https://formulae.brew.sh/formula/nvm)
- `nvm install 20`
- `nvm use 20`
- `npm install -g yarn`
- `yarn clean-install`
- `yarn run dev` - This starts the client UI
- `yarn run dev-server` - This starts the server (Run the last two commands in seperate terminal instances to get hot reloading for UI)

# How to build desktop application?

App uses [ElectronJs](https://www.electronjs.org/) in order to package Vite+React app into Native desktop app, so in order to run native app locally, please follow the below steps - 
- `cd server`
- `yarn make` after this command in `public/` folder a new .dmg/.exe will get populated


# How to build electron app locally?

- `cd server`
- `yarn make`


<!-- Questions can be useful but optional, this gives you a place to say, "This is how to contact this project maintainers or create PRs -->
If you have any questions or issues you can create a new [issue here][issues].

Pull requests are very welcome! Make sure your patches are well tested.
Ideally create a topic branch for every separate change you make. For
example:

1. Fork the repo
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License

All source files must include a Copyright and License header. The SPDX license header is 
preferred because it can be easily scanned.

If you would like to see the detailed LICENSE click [here](LICENSE).

```text
#
# Copyright IBM Corp. {Year project was created} - {Current Year}
# SPDX-License-Identifier: Apache-2.0
#
```
## Authors

- Author: Ashrith Shetty <ashrithshetty@in.ibm.com>
- Author: Vaishnavi Sanjay Killekar <vaishnavi.killekar@ibm.com>
- Author: Ashwand Nair <ashwana1@in.ibm.com>
- Author: Omkar Ajagunde <Omkar.Ajagunde@ibm.com>

[issues]: https://github.com/IBM/repo-template/issues/new
