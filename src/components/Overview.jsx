/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

function Overview() {
	return (
		<div>
			<h2 style={{ padding: "10px 20px", textAlign: "left", color: "black" }}>What can IBM ECHO do?</h2>

			<p style={{ padding: "10px 20px", textAlign: "left", color: "black" }}>
				IBM ECHO is a API Requestor which refers to a component or entity within a software system that sends requests
				to an API in order to retrieve data or perform actions. In client-server architecture or distributed systems,
				the API requestor is usually the client application or service that initiates communication with the API. ECHO
				sends HTTP requests to specific endpoints defined by the API, specifying the desired operation (e.g., fetching
				data, updating resources) along with any required parameters or authentication credentials. Upon receiving the
				request, the API processes it, performs the necessary operations, and returns a response containing the
				requested data or indicating the outcome of the action.
			</p>

			<h2 style={{ padding: "10px 20px", textAlign: "left", color: "black" }}>Features</h2>

			<h3 style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>Collections</h3>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				Welcome to IBM ECHO, where managing your APIs is both efficient and effortless! Collections help organise all
				your related APIs into one bundle.
			</p>

			<h3 style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>Importing collections</h3>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				With IBM ECHO, importing collections becomes a seamless process, allowing you to quickly integrate your existing
				workflows and tools into our platform. You can easily get started by importing collections from your existing
				tools like Postman and Insomnia.
			</p>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				<li>
					Navigate to the options menu next to the "Add New Collection +" button located at the top-left corner of the
					screen.
				</li>
				<li>Select the "Import Collection" option from the menu.</li>
				<li>Browse your file system to locate the desired collection file.</li>
				<li>Once selected, click "Import" to initiate the import process.</li>
			</p>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				Upon completion, the imported collection will be displayed at the top of the Collection View.
			</p>

			<h3 style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>Creating new collections</h3>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				You can create new collections in IBM ECHO with the following steps -
			</p>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				<li>Click on the "Add new collection +" button at the top-left corner</li>
				<li>Enter your desired name for the new collection.</li>
				<li>Hit "Create".</li>
			</p>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				Your created collection will show up at the top.
			</p>

			<h3 style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>API Requests</h3>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				Discover the full potential of IBM ECHO with comprehensive support for all available HTTP methods, empowering
				you to execute your APIs effortlessly. Follow these straightforward steps to kickstart your API journey:
			</p>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				<li>
					Navigate to the options menu adjacent to the collection where you intend to create the API. Alternatively,
					craft a new request by selecting "Add New Request +" from the options menu within the API tabs section.
				</li>
				<li>Choose the required HTTP method from the dropdown menu.</li>
				<li>Input your API endpoint in the designated input box.</li>
				<li>
					Enhance your request by including headers and query parameters in the convenient key: value format provided
					below the endpoint input.
				</li>
				<li>
					If necessary, incorporate a request payload in the "Request body" section, ensuring compatibility with the
					chosen payload type.
				</li>
				<li>Hit "Send".</li>
			</p>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				Your API response will be available in the Response section along with additional details.
			</p>

			<h3 style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>Test Runner</h3>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				Introducing the Test Runner, a powerful feature within IBM ECHO designed to streamline API testing, perform load
				testing, and monitor API execution time with precision and efficiency.
			</p>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				To leverage the Test Runner's capabilities, follow these steps:
			</p>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				<li>Navigate to the options menu adjacent to the collection where you intend to create an API Test Runner.</li>
				<li>From the menu options, select "Test Runner."</li>
				<li>
					Choose the APIs you wish to run sequentially, specifying the number of iterations and any desired delay.
				</li>
				<li>Once configured, hit "Run" to initiate the testing process.</li>
			</p>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				During execution, you'll have realtime access to API execution results, including the average execution time.
				Additionally, should the need arise, you can halt the Test Runner mid-execution using the "Stop" button,
				providing flexibility and control over your testing workflows.
			</p>

			<h3 style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>Environment variables</h3>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				Unlock the full potential of IBM ECHO by effortlessly configuring environment variables, seamlessly adaptable
				across API endpoints, query parameters, and headers. Follow these simple steps to get started:
			</p>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				<li>Navigate to "Settings" at the bottom-left corner.</li>
				<li>Go to the "Environment variables" tab.</li>
				<li>Enter the desired variable name and value, and click "Add +" to add it to your environment.</li>
				<li>
					Once configured, leverage your environment variable within your APIs by encapsulating it within double curly
					braces in your API endpoint or headers or query parameters, like so: &#123;&#123;variable_name&#125;&#125;.
				</li>
			</p>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				For example, if you've set an environment variable named "host" with the value "ibm", you can effortlessly
				incorporate it into your API endpoint using the syntax: http://&#123;&#123;host&#125;&#125;.com.
			</p>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				Your variable dynamically substitutes its value at runtime, ensuring flexibility and adaptability in your API
				interactions.
			</p>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				With IBM ECHO, configuring and utilizing environment variables is a breeze, enabling you to streamline your
				workflow and maximize efficiency with ease.
			</p>

			<h3 style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>Certificates</h3>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				Experience seamless integration with your APIs by setting up client SSL certificates effortlessly with IBM ECHO.
				Follow these steps to configure your client SSL certificates:
			</p>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				<li>Navigate to "Settings" at the bottom-left corner.</li>
				<li>Go to the "Certificates" tab.</li>
				<li>Select "Add New" to initiate the setup process.</li>
				<li>Enter the Host, Port, and attach the certificate and key files, including any passphrase if required.</li>
				<li>
					Once configured, ECHO seamlessly attaches the client SSL certificate to APIs with the same host name and port.
				</li>
			</p>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				With IBM ECHO, ensuring secure communication with your APIs is a breeze, allowing you to focus on innovation and
				productivity with peace of mind.
			</p>

			<h3 style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>Exporting collections</h3>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				Introducing the Export Collections feature in IBM ECHO – a powerful feature that allows you to effortlessly
				export entire collections or specific subfolders. With the added functionality of excluding sensitive header
				values, sharing collections securely has never been easier.
			</p>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				To export a collection or subfolder, follow these simple steps:
			</p>

			<p style={{ padding: "10px 50px", textAlign: "left", color: "black" }}>
				<li>Navigate to the options menu adjacent to the desired collection or subfolder.</li>
				<li>Select the "Export" option from the menu.</li>
				<li>
					By default, the "Include header values" checkbox is selected in the confirmation popup. If desired, you can
					uncheck this option to exclude header values from the export file.
				</li>
				<li>
					Click "Export" to initiate the export process, and the file will be downloaded directly to your file system.
				</li>
			</p>

			<p style={{ padding: "10px 30px", textAlign: "left", color: "black" }}>
				Once exported, you can seamlessly share the file with your teammates, knowing that sensitive header values have
				been securely excluded. Furthermore, the exported file can be easily imported back into IBM ECHO whenever
				needed, ensuring smooth collaboration and workflow continuity.
			</p>
		</div>
	);
}
export default Overview;
