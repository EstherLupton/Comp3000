import React from "react";

function ExtractForm() {
    const [imageFile, setImageFile] = React.useState(null);
    const [extractedMessage, setExtractedMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [lsbType, setLsbType] = React.useState("sequential");
    const [secretKey, setSecretKey] = React.useState("");

    const handleImageChange = (e) => setImageFile(e.target.files[0]);

    const handleExtract = async (e) => {
        e.preventDefault();
        if (!imageFile) {
            alert("Please select an image file first.");
            return;
        }
        
        if (lsbType === "random" && !secretKey) {
            alert("Please enter a secret key for random LSB.");
            return;
        }

        setLoading(true);
        setProgress(0);

        const interval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 90) return prev; 
            return prev + 10;
        });
    }, 300);

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("lsbType", lsbType);
        if (lsbType === "random") {
            formData.append("secretKey", secretKey);
        }

        try {
            const response = await fetch("http://localhost:5000/extract/lsb", {
                method: "POST",
                body: formData,
            });

            clearInterval(interval); 
            setProgress(100);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error:", errorText);
                alert("Failed to extract message. Status: " + response.status);
                return;
            }

            const data = await response.json();
            const message = data.extractedMessage || data.hiddenData || "";
            setExtractedMessage(message);
        } catch (error) {
            console.error("Error extracting message:", error);
            alert("Failed to extract message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="extract-form">
            <h2 className="h5">Extract Message</h2>

            {/* LSB Mode Selection */}
            <div className="mb-3">
                <button
                    type="button"
                    className={`btn ${lsbType === "sequential" ? "btn-primary" : "btn-outline-primary"} me-2`}
                    onClick={() => setLsbType("sequential")}
                >
                    Sequential LSB
                </button>

                <button
                    type="button"
                    className={`btn ${lsbType === "random" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setLsbType("random")}
                >
                    Random LSB
                </button>
            </div>
            
            {lsbType === "random" && (
                <div className="mb-3">
                    <label className="form-label">Secret Key</label>
                    <input
                        className="form-control"
                        type="text"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="Enter secret key"
                    />
                </div>
            )}
            <form onSubmit={handleExtract}>
                <div className="mb-3">
                    <label className="form-label">Choose Image</label>
                    <input className="form-control" type="file" accept="image/*" onChange={handleImageChange} />
                </div>

                <button className="btn btn-secondary" type="submit" disabled={loading}>
                    {loading ? "Extracting…" : "Extract Message"}
                </button>
                {loading && (
                    <div className="progress mt-2">
                        <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: `${progress}%` }} aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                )}
            </form>

            {extractedMessage && (
                <div className="extracted-message mt-3">
                    <h6>Extracted Message</h6>
                    <pre className="p-2 bg-light">{extractedMessage}</pre>
                </div>
            )}
        </div>
    );
}

export default ExtractForm;