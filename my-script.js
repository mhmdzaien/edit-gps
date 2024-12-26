let defaultExif = {
  "0th": {
    256: 3264,
    257: 2448,
    271: "samsung",
    272: "SM-A715F",
    274: 1,
    305: "Timestamp Camera",
    306: "2024:10:19 15:38:51",
    34665: 176,
    34853: 366,
  },
  Exif: {
    33434: [15, 10000],
    33437: [18000, 10000],
    34850: 2,
    34855: 29,
    36867: "2024:10:19 15:38:51",
    36868: "2024:10:19 15:38:51",
    37383: 2,
    37384: 0,
    37385: 0,
    37386: [5230, 1000],
  },
  GPS: {
    1: "S",
    2: [
      [2, 1],
      [33, 1],
      [39319, 1000],
    ],
    3: "E",
    4: [
      [115, 1],
      [19, 1],
      [15848, 1000],
    ],
  },
};
let scale = 3;
const defaultCoordinate = [51.505, -0.09];
var map = L.map("maps", {
  zoomControl: false,
  attributionControl: false,
}).setView(defaultCoordinate, 16);
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 18,
  }
).addTo(map);
var greenIcon = L.icon({
  iconUrl:
    window.location.origin + window.location.pathname + "/assets/marker.png",
  iconSize: [25, 41], // size of the icon
  iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
});
var marker = L.marker(defaultCoordinate, { icon: greenIcon }).addTo(map);
let cropperData;
function readURL(input, target) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function (e) {
      let image = new Image();
      image.src = e.target.result;
      image.onload = function () {
        scale = this.width / 1024;
        console.log(scale);
        let width = 1024;
        let height = 768;
        if (this.width < this.height) {
          width = 768;
          height = 1024;
        }
        $(".container-gps").width(`${width}px`);
        $(".container-gps").height(`${height}px`);
        $("#base-image").cropper("destroy");
        $("#base-image").attr("src", e.target.result);
        $("#base-image").cropper({
          viewMode: 1,
          minContainerWidth: width / 2,
          minContainerHeight: height / 2,
        });
        cropperData = $("#base-image").data("cropper");
        $(target).css("background-image", "url(" + e.target.result + ")");
      };
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function decimalToDMSExif(lat, lon) {
  function toDMS(decimal, isLatitude) {
    const isNegative = decimal < 0;
    decimal = Math.abs(decimal);

    const degrees = Math.floor(decimal);
    const minutesDecimal = (decimal - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = (minutesDecimal - minutes) * 60;

    return {
      degrees: degrees,
      minutes: minutes,
      seconds: seconds.toFixed(3),
      direction: isLatitude ? (isNegative ? "S" : "N") : isNegative ? "W" : "E",
    };
  }

  const latDMS = toDMS(lat, true);
  const lonDMS = toDMS(lon, false);

  const exif = {
    1: latDMS.direction,
    2: [
      [latDMS.degrees, 1],
      [latDMS.minutes, 1],
      [latDMS.seconds * 1000, 1000],
    ],
    3: lonDMS.direction,
    4: [
      [lonDMS.degrees, 1],
      [lonDMS.minutes, 1],
      [lonDMS.seconds * 1000, 1000],
    ],
  };

  return {
    exif: exif,
    latitude: `${latDMS.degrees}° ${latDMS.minutes}' ${latDMS.seconds}" ${latDMS.direction}`,
    longitude: `${lonDMS.degrees}° ${lonDMS.minutes}' ${lonDMS.seconds}" ${lonDMS.direction}`,
  };
}

$(() => {
  $("#btn-position").click(function () {
    $(this).prepend(
      `<div class="spinner-border spinner-border-sm text-light" role="status"><span class="visually-hidden">Loading...</span></div>`
    );
    $(this).attr("disabled", true);
    const latLong = $("input[name='latLong']").val();
    const [lat, long] = latLong
      .trim()
      .split(",")
      .map((item) => item.trim());
    $("#lat").html(lat);
    $("#long").html(long);
    fetch(
      `https://geocode.maps.co/reverse?accept-language=id&lat=${lat}&lon=${long}&api_key=671ccc24ea7cf962310293sduc02b52`
    )
      .then((res) => {
        return res.json();
      })
      .then((jsonValue) => {
        const { road, village, county, state } = jsonValue.address;
        let address = `${road ?? ""} ${village}, ${county}, ${state}`;
        $("#fcalamat").val(address);
        $("#fcalamat").change();
        $("#alamat").html(address.replaceAll(",", "<br/>"));
      })
      .finally(() => {
        $(this).children(".spinner-border").remove();
        $(this).removeAttr("disabled");
      });
    const dms = decimalToDMSExif(lat, long);
    defaultExif.GPS = dms.exif;
    map.setView([lat, long]);
    marker.setLatLng([lat, long]);
  });
  $("#fc4").change(function () {
    const value = $(this).val();
    const name = $(this).attr("name");
    const date = new Date(value);
    $(`#${name}`).html(
      `${date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} ${date.toLocaleTimeString("en-EN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`
    );
  });
  $(".input-form").keyup(function () {
    const value = $(this).val();
    const name = $(this).attr("name");
    if (name === "alamat") {
      $(`#${name}`).html(value.replaceAll(",", "<br/>"));
    } else {
      $(`#${name}`).html(value);
    }
  });
  $("#formFile").change(function () {
    readURL(this, ".container-gps");
  });
  $("#btn-download").click(function () {
    const domNode = document.getElementById("preview");
    html2canvas(domNode, {
      useCORS: true,
      scale: scale,
    }).then(function (canvas) {
      var link = document.createElement("a");
      link.download = "edit-gps.jpg";
      const imageData = canvas.toDataURL("image/jpeg");
      const exif = piexif.dump(defaultExif);
      link.href = piexif.insert(exif, imageData);
      link.click();
    });
  });
  $("#btn-crop").click(function () {
    $(".container-gps").css(
      "background-image",
      "url(" + cropperData.getCroppedCanvas().toDataURL("image/jpeg") + ")"
    );
  });
});
