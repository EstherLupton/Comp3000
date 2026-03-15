import React from "react";


function EmbedForm({ embedMethod, setEmbedMethod, lsbType, setLsbType, setDifferenceMap, setSteggedUrl, setOriginalImage, steggedUrl }) {
    const [imageFile, setImageFile] = React.useState(null);
    const [message, setMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [secretKey, setSecretKey] = React.useState("");
    const [remainingCapacity, setCapacity] = React.useState(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState(null);
    const [dctQuality, setDctQuality] = React.useState(80);
    const [showPassword, setShowPassword] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!imageFile || !message) {
            alert("Please select an image file and enter a message.");
            return;
        }

        if (embedMethod === "lsb" && lsbType === "random" && !secretKey) {
            alert("Please enter a secret key for random LSB.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("message", message);

        const encoder = new TextEncoder(); 
        const byteArray = encoder.encode(message);
        const byteLength = byteArray.length;

        if (embedMethod === "lsb") {
            formData.append("lsbType", lsbType);
            if (lsbType === "random"){ 
                formData.append("secretKey", secretKey);
            }
        } else if (embedMethod === "dct") {
            formData.append("dctQuality", dctQuality);
        }

        try {
            const endpoint = embedMethod === "lsb" ? "lsb" : "dct";
            const response = await fetch(`http://localhost:5000/${endpoint}`, {
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
            setSteggedUrl(data.steggedUrl);
            setDifferenceMap(data.differenceUrl);
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
        const file = e.target ? e.target.files[0] : e; 
        if (!file) return;

        const url = URL.createObjectURL(file);
        setImageFile(file);
        setPreviewUrl(url);
        setOriginalImage(url)

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

            const maxBits = data.capacity.bits;
            setCapacity(Math.floor((maxBits / 8)*0.99545));
        } catch (error) {
            console.error("Error checking image capacity:", error);
        }

    };

    return (
        <div className="embed-form">

            <div className="method-selector-label">Embedding Method</div>
            <div className="embed-extract-buttons">
            <button 
                className={embedMethod === "lsb" ? "active" : ""} 
                onClick={() => setEmbedMethod("lsb")}
            >
                LSB (Spatial)
            </button>

            <button 
                className={embedMethod === "dct" ? "active" : ""} 
                onClick={() => setEmbedMethod("dct")}
>
                DCT (Frequency)
            </button>
            </div>
            {embedMethod === "lsb" ? (
                <div className="lsb-sub-settings animate-slide-down">
                <label className="sub-label">LSB Mode</label>
                <div className="lsb-mode-buttons">
                    <button className={lsbType === "sequential" ? "active" : ""} onClick={() => setLsbType("sequential")}>Sequential</button>
                    <button className={lsbType === "random" ? "active" : ""} onClick={() => setLsbType("random")}>Random</button>
                </div>
                </div>
            ) : (
                <div className="dct-sub-settings animate-slide-down">
                <label className="sub-label">DCT Quality Factor: {dctQuality}</label>
                <input 
                    type="range" 
                    min="10" max="100" 
                    value={dctQuality} 
                    onChange={(e) => setDctQuality(e.target.value)}
                    className="custom-range"
                />
                </div>
            )}

            <div 
                className={`file-drop-area ${isDragging ? "dragging" : ""} ${previewUrl ? "has-file" : ""}`} 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
                onDragLeave={() => setIsDragging(false)} 
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); onImageUpload(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById('hiddenFileInput').click()}
            >
                {previewUrl ? (
                    <div className="upload-preview">
                        <img src={previewUrl} alt="Preview" style={{maxHeight: '120px', borderRadius: '8px'}} />
                        <p style={{marginTop: '10px', fontSize: '0.8rem'}}>Change Image</p>
                    </div>
                ) : (
                    <>
                        <div style={{fontSize: '1.5rem', marginBottom: '8px'}}>📁</div>
                        <p>Drop image or <span>click to browse</span></p>
                    </>
                )}
                <input 
                    id="hiddenFileInput"
                    type="file" 
                    accept="image/*" 
                    onChange={onImageUpload} 
                    style={{display: 'none'}} 
                />
            </div>

            {lsbType === "random" && (
               <div className="glass-input-group mt-3">
                <label>Secret Key</label>
                <div className="password-input-wrapper">
                    <div className="input-with-icon">
                        <input
                            className="form-control"
                            type={showPassword ? "text" : "password"}
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            placeholder="Required for Random LSB"
                        />
                        <button 
                            type="button"
                            className={`eye-toggle-btn ${showPassword ? 'active' : ''}`}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}>
                                👁
                        </button>
                    </div>
                </div>
</div>
            )}

            <div className="glass-input-group mt-3">
                <label>Secret Message</label>
                <div className="textarea-wrapper">
                    <textarea
                        className="form-control custom-textarea"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What's the secret?"
                        maxLength={remainingCapacity || undefined}
                        rows="4"
                    />
                    {remainingCapacity !== null && (
                        <span className="capacity-indicator-text">
                            {remainingCapacity - message.length} characters remaining
                        </span>
                    )}
                </div>
            </div>

            <button className="glow-button mt-4 w-100" onClick={handleSubmit} disabled={loading}>
                {loading ? "Embedding..." : "Embed Message"}
            </button>

            {steggedUrl && (
                <div className="stegged-result mt-4">
                    <button className="btn btn-success w-100 mb-3" onClick={handleDownload}>
                        Download Stegged Image
                    </button>
                </div>
            )}
        </div>
    );
}

export default EmbedForm;
