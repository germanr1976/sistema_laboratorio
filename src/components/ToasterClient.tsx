"use client";
import React from "react";
import { Toaster } from "react-hot-toast";

export default function ToasterClient() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{
                duration: 8000,
                style: {
                    minWidth: "400px",
                    minHeight: "60px",
                    fontSize: "1.2rem",
                },
                success: {
                    duration: 5000,
                    style: {
                        background: "#e0f7fa",
                        color: "#00796b",
                        minWidth: "400px",
                        minHeight: "60px",
                        fontSize: "1.2rem",
                    },
                },
                error: {
                    duration: 10000,
                    style: {
                        background: "#ffebee",
                        color: "#c62828",
                        minWidth: "400px",
                        minHeight: "60px",
                        fontSize: "1.2rem",
                    },
                },
            }}
        />
    );
}
