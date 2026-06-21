import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import App from "./App"
import { queryClient } from "./lib/queryClient"
import "./index.css"

const toastOptions = {
  duration: 3500,
  style: { borderRadius: "10px", fontSize: "14px" },
  success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
  error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={toastOptions} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
