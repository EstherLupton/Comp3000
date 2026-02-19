import React from "react";

function EmbedForm() {
    const [imageFile, setImageFile] = React.useState(null);
    const [message, setMessage] = React.useState("");
    const [steggedUrl, setSteggedUrl] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [lsbType, setLsbType] = React.useState("sequential");
    const [secretKey, setSecretKey] = React.useState("");
    const [remainingCapacity, setCapacity] = React.useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!imageFile || !message) {
            alert("Please select an image file and enter a message.");
            return;
        }

        if (lsbType === "random" && !secretKey) {
            alert("Please enter a secret key for random LSB.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("message", message);
        formData.append("lsbType", lsbType);
        if (lsbType === "random") {
            formData.append("secretKey", secretKey);
        }

        try {
            const response = await fetch("http://localhost:5000/lsb", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error:", errorText);
                alert("Failed to embed message.");
                return;
            }

            const data = await response.json();
            console.log("Backend response:", data);
            setSteggedUrl(data.steggedUrl);
        } catch (error) {
            console.error("Error embedding message:", error);
            alert("Failed to embed message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
    if (!steggedUrl || !imageFile) return;

    try {
        const response = await fetch(steggedUrl);
        const blob = await response.blob();

        const blobUrl = window.URL.createObjectURL(blob);

        const originalName = imageFile.name;
        const nameWithoutExt =
            originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
        const extension =
            originalName.substring(originalName.lastIndexOf(".")) || ".png";

        const now = new Date();
        const formattedDate = now.toISOString()
            .replace("T", "_")
            .replace(/:/g, "-")
            .split(".")[0];

        const finalFileName = `${nameWithoutExt}_stegged_${formattedDate}${extension}`;

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = finalFileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
        console.error("Download failed:", error);
    }
    };


    const onImageUpload = async (e) => {
    if (!e?.target?.files?.length) return;

    const file = e.target.files[0];
    console.log("Selected file:", file);

    setImageFile(file);

    try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("http://localhost:5000/capacity", {
            method: "POST",
            body: formData,
        });


        if (!response.ok) {
            const errorText = await response.text();
            console.error("Capacity error response:", errorText);
            return;
        }

        const data = await response.json();

        const maxChars = Math.floor((data.capacity.maxCapacity - 16) / 8);
        setCapacity(maxChars); 

    } catch (error) {
        console.error("Error checking image capacity:", error);
    }

};

    return (
        <div className="embed-form">
            <h2 className="h5">Embed Message</h2>

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

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Choose Image</label>
                    <input
                        className="form-control"
                        type="file"
                        accept="image/*"
                        onChange={onImageUpload}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Secret Message</label>
                    <div className="textarea-wrapper">
                        <textarea
                            className="form-control custom-textarea"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter your secret message here"
                            maxLength={remainingCapacity || undefined}
                        />
                        {remainingCapacity !== null && (
                            <span className="capacity-indicator">
                                {remainingCapacity - message.length} characters remaining
                            </span>
                        )}
                    </div>
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
                            required
                        />
                    </div>
                )}

                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Embedding…" : "Embed Message"}
                </button>
            </form>

            {steggedUrl && (
                <div className="stegged-result mt-3">
                    <button 
                        className="btn btn-success mt-2"
                        onClick={handleDownload}
                    >
                        Download Stegged Image
                    </button>
                                        <div className="mt-2">
                        <img src={steggedUrl} alt="Stegged" className="img-fluid" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default EmbedForm;
