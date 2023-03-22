const buttonOuterHTMLFallback = `<button class="btn flex justify-center gap-2 btn-neutral" id="download-png-button">Try Again</button>`;
async function init() 
{
  if (window.buttonsInterval) 
  {
    clearInterval(window.buttonsInterval);
  }

  window.buttonsInterval = setInterval(() => {
    const actionsArea = document.querySelector("form>div>div");
    if (!actionsArea) 
    {
      return;
    }

    if (shouldAddButtons(actionsArea)) 
    {
      let TryAgainButton = actionsArea.querySelector("button");
      if (!TryAgainButton) 
      {
        const parentNode = document.createElement("div");
        parentNode.innerHTML = buttonOuterHTMLFallback;
        TryAgainButton = parentNode.querySelector("button");
      }
      addActionsButtons(actionsArea, TryAgainButton);
    }
  }, 200);
}

function shouldRemoveButtons() 
{
  const isOpenScreen = document.querySelector("h1.text-4xl");
  if(isOpenScreen)
  {
    return true;
  }
  const inConversation = document.querySelector("form button>div");
  if(inConversation)
  {
    return true;
  }
  return false;
}

function shouldAddButtons(actionsArea) 
{
  if(shouldRemoveButtons())
  {
    return false;
  }

  const buttons = actionsArea.querySelectorAll("button");
  const hasTryAgainButton = Array.from(buttons).some((button) => 
  {
    return !button.id?.includes("download");
  });
  if (hasTryAgainButton && buttons.length === 1) 
  {
    return true;
  }

  const isOpenScreen = document.querySelector("h1.text-4xl");
  if (isOpenScreen) 
  {
    return false;
  }

  const finishedConversation = document.querySelector("form button>svg");
  const hasShareButtons = actionsArea.querySelectorAll("button[share-ext]");
  if (finishedConversation && !hasShareButtons.length) 
  {
    return true;
  }

  return false;
}

const Format = 
{
  PNG: "png",
  PDF: "pdf",
};

function removeButtons() 
{
  const downloadButton = document.getElementById("download-png-button");
  const downloadPdfButton = document.getElementById("download-pdf-button");

  if (downloadButton) 
  {
    downloadButton.remove();
  }

  if (downloadPdfButton) 
  {
    downloadPdfButton.remove();
  }

}

function addActionsButtons(actionsArea, TryAgainButton) 
{
  const downloadButton = TryAgainButton.cloneNode(true);
  downloadButton.id = "download-png-button";
  downloadButton.setAttribute("share-ext", "true");
  downloadButton.innerText = "Generate PNG";
  
  downloadButton.onclick = () => {
    downloadThread();
  };

  actionsArea.appendChild(downloadButton);
  const downloadPdfButton = TryAgainButton.cloneNode(true);
  downloadPdfButton.id = "download-pdf-button";
  downloadButton.setAttribute("share-ext", "true");
  downloadPdfButton.innerText = "Download PDF";
  
  downloadPdfButton.onclick = () => {
    downloadThread({ as: Format.PDF });
  };

  actionsArea.appendChild(downloadPdfButton);

}

function downloadThread({ as = Format.PNG } = {}) 
{
  const elements = new Elements();
  elements.fixLocation();
  const pixelRatio = window.devicePixelRatio;
  const minRatio = as === Format.PDF ? 2 : 2.5;
  window.devicePixelRatio = Math.max(pixelRatio, minRatio);

  html2canvas(elements.thread, {
    letterRendering: true,
  }).then(async function (canvas) {
    elements.restoreLocation();
    window.devicePixelRatio = pixelRatio;
    const imgData = canvas.toDataURL("image/png");
    requestAnimationFrame(() => {
      if (as === Format.PDF) {
        return handlePdf(imgData, canvas, pixelRatio);
      } else {
        handleImg(imgData);
      }
    });
  });
}

function handleImg(imgData) 
{
  const binaryData = atob(imgData.split("base64,")[1]);
  const data = [];

  for (let i = 0; i < binaryData.length; i++) 
  {
    data.push(binaryData.charCodeAt(i));
  }

  const blob = new Blob([new Uint8Array(data)], { type: "image/png" });
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank");
}

function handlePdf(imgData, canvas, pixelRatio) 
{
  const { jsPDF } = window.jspdf;
  const orientation = canvas.width > canvas.height ? "l" : "p";
  var pdf = new jsPDF(orientation, "pt", [
    canvas.width / pixelRatio,
    canvas.height / pixelRatio,
  ]);
  var pdfWidth = pdf.internal.pageSize.getWidth();
  var pdfHeight = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save("chat-gpt.pdf");
}

class Elements 
{
  constructor() 
  {
    this.init();
  }

  init() 
  {
    this.spacer = document.querySelector(".w-full.h-32.md\\:h-48.flex-shrink-0");
    this.thread = document.querySelector(
      "[class*='react-scroll-to-bottom']>[class*='react-scroll-to-bottom']>div"
    );
    this.positionForm = document.querySelector("form").parentNode;
    
    this.scroller = Array.from(
      document.querySelectorAll('[class*="react-scroll-to"]')
    ).filter((el) => el.classList.contains("h-full"))[0];

    this.hiddens = Array.from(document.querySelectorAll(".overflow-hidden"));
    this.images = Array.from(document.querySelectorAll("img[srcset]"));
  }

  fixLocation() 
  {
    this.hiddens.forEach((el) => {
      el.classList.remove("overflow-hidden");
    });
    this.spacer.style.display = "none";
    this.thread.style.maxWidth = "960px";
    this.thread.style.marginInline = "auto";
    this.positionForm.style.display = "none";
    this.scroller.classList.remove("h-full");
    this.scroller.style.minHeight = "100vh";
    this.images.forEach((img) => {
      const srcset = img.getAttribute("srcset");
      img.setAttribute("srcset_old", srcset);
      img.setAttribute("srcset", "");
    });
    document.body.style.lineHeight = "0.5";
  }

  restoreLocation() 
  {
    this.hiddens.forEach((el) => {
      el.classList.add("overflow-hidden");
    });
    this.spacer.style.display = null;
    this.thread.style.maxWidth = null;
    this.thread.style.marginInline = null;
    this.positionForm.style.display = null;
    this.scroller.classList.add("h-full");
    this.scroller.style.minHeight = null;
    this.images.forEach((img) => {
      const srcset = img.getAttribute("srcset_old");
      img.setAttribute("srcset", srcset);
      img.setAttribute("srcset_old", "");
    });
    document.body.style.lineHeight = null;
  }
}

function selectElementByClassPrefix(classPrefix) 
{
  const element = document.querySelector(`[class^='${classPrefix}']`);
  return element;
}

if (document.readyState === "complete" || document.readyState === "interactive") 
{
  init();
} 
else 
{
  document.addEventListener("DOMContentLoaded", init);
}
