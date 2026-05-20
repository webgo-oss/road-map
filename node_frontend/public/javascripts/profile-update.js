 const box = document.getElementById("profileImageBox");
          const input = document.getElementById("photoInput");
          const img = document.getElementById("profilePhoto");

          box.addEventListener("click", () => input.click());

          input.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => img.src = ev.target.result;
            reader.readAsDataURL(file);
          });