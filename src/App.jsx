import { useRoutes } from "react-router-dom";
import { Suspense } from "react";
import { routes } from "./constants/routes";
import { AuthProvider } from "./context/authContext";
import { AuthzProvider } from "./context/authzContext";
import AppLoading from "./components/AppLoading/AppLoading";

function RoutedApp() {
	const element = useRoutes(routes);
	return (
		<Suspense fallback={<AppLoading />}>
			{element}
		</Suspense>
	);
}

function App() {
	return (
		<AuthProvider>
			<AuthzProvider>
				<RoutedApp />
			</AuthzProvider>
		</AuthProvider>
	)
}

export default App
