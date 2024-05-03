import { Header, HeaderName, HeaderNavigation, HeaderMenuItem } from "@carbon/react";
import RouterComponent from "./components/RouterComponent";
import { Link } from "react-router-dom";

function App() {
	return (
		<>
			<Header>
				<HeaderName
					href="/"
					prefix=""
				>
					IBM | ECHO
				</HeaderName>
				<HeaderNavigation aria-label="IBM [Platform]">
					<HeaderMenuItem>
						<Link
							className="headerLink"
							to="/overview"
						>
							Overview
						</Link>
					</HeaderMenuItem>
				</HeaderNavigation>
			</Header>
			<RouterComponent />
		</>
	);
}

export default App;
