<script>
  import { onMount, getContext } from "svelte";
  import { writable } from "svelte/store";
  import Swal from "sweetalert2";

  import {
    jsonData,
    cartData,
    visibility,
    logged,
    show,
    user,
    loginData,
    cartCount,
    carts,
    progress
  } from "./store.js";
  import { md5 } from "./md5.js";

  export let type = "addToCart";
  export let collection = "products";
  export let document = {};
  export let dataDismiss = "";

  let btnType = "";
  let handler = () => {};
  let classes = "";
  let url = "";
  let id = writable({});

  function toggle() {
    logged.set(!$logged);
    if ($visibility == "hidden") visibility.set("");
    else visibility.set("hidden");
  }

  function toggleShowForForgot() {
    show.set(!$show);
  }

  function clearData() {
    loginData.nick = "";
    loginData.password = "";
    window.document.getElementById("loginNick").value = "";
    window.document.getElementById("loginPassword").value = "";
  }

  function clearPasswds() {
    window.document.getElementById("pass1").value = "";
    window.document.getElementById("pass2").value = "";
  }

  const URL = getContext("URL");

  onMount(() => {
    switch (type) {
      case "addToCart":
        handler = addToCart;
        classes = "btn btn-dark btn-addToCart";
        break;
      case "register":
        handler = register;
        classes = "btn btn-primary btn-register";
        btnType = "submit";
        break;
      case "login":
        handler = login;
        classes = "btn btn-primary pull-right btn-login";
        break;
      case "logout":
        handler = logout;
        classes = "btn btn-outline-light my-0 ml-2 my-sm-0 btn-logout";
        break;
      case "deleteCart":
        handler = deleteCart;
        classes = "btn btn-dark my-0 ml-2 my-sm-0 btn-deleteCart";
        break;
      case "purchase":
        handler = purchase;
        classes = "btn btn-dark my-0 ml-4 btn-purchase";
        break;
      case "forgot":
        handler = forgot;
        classes = "btn btn-dark my-0 ml-4 btn-forgot";
        break;
      case "newPass":
        handler = newPass;
        classes = "btn btn-dark my-0 ml-4 btn-newPass";
        break;
      default:
    }
    switch (collection) {
      case "products":
        url = URL.products;
        break;
      case "users":
        url = URL.users;
        break;
      case "carts":
        url = URL.carts;
        break;
      case "purchases":
        url = URL.purchases;
        break;
      default:
    }
  });

  async function getCount() {
    let count = 0;
    const response = await fetch(URL.carts + "user/" + user.data._id);
    const data = await response.json();
    data.forEach(element => {
      ++count;
    });
    $cartCount = await count;
  }
  async function getProductById(productId) {
    const productResponse = await fetch(URL.products + productId);
    return await productResponse.json();
  }
  async function deleteForEachCart(element) {
    let productToPut = {};
    productToPut = await getProductById(element.productId);
    if ((await productToPut.stock) >= element.amount) {
      productToPut.stock -= element.amount;
      await fetch(URL.products + element.productId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productToPut)
      }).catch(err => {
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error",
          showConfirmButton: true
        });
      });
      await fetch(
        URL.carts + "user/" + element.userId + "/product/" + element.productId,
        {
          method: "DELETE"
        }
      ).catch(err => {
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error",
          showConfirmButton: true
        });
      });
      return true;
    } else {
      return false;
    }
  }
  function deleteCartsAndUpdateProducts() {
    let allOk = true;
    $carts.forEach(element => {
      allOk = deleteForEachCart(element);
      if (!allOk) {
        return false;
      }
    });
    return allOk;
  }
  async function purchase() {
    let purchase = {};
    purchase.cart = $carts;
    purchase.payment = document;
    purchase.paid = true;
    let allOk = await deleteCartsAndUpdateProducts();
    if (allOk) {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchase)
      })
        .then(res => res.json())
        .then(data => {
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Compra realizada correctamente",
            showConfirmButton: false,
            timer: 1500
          });
          $carts = fetch(URL.carts + "user/" + user.data._id);
          getCount();
        })
        .catch(err => {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error en la compra",
            showConfirmButton: false,
            timer: 1500
          });
        });
    } else {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Por favor, haga los cambios necesarios",
        showConfirmButton: true
      });
    }
  }
  function deleteCart() {
    fetch(url + "user/" + document.userId + "/product/" + document.productId, {
      method: "DELETE"
    });
    Swal.fire({
      position: "center",
      icon: "success",
      title: "Producto eliminado del carro",
      showConfirmButton: false,
      timer: 1500
    });
    $carts = fetch(URL.carts + "user/" + user.data._id);
    getCount();
  }
  function addToCart() {
    $cartData = { userId: user.data._id, productId: document._id, amount: 1 };
    if (
      Object.keys($cartData).length > 1 &&
      Object.values($cartData).every(x => x !== undefined && x != "")
    ) {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify($cartData)
      })
        .then(res => res.json())
        .then(data => {})
        .catch(err => {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error añadiendo el producto",
            showConfirmButton: false,
            timer: 1500
          });
        });
    }
    getCount();
    Swal.fire({
      position: "center",
      icon: "success",
      title: "Se ha añadido al carro",
      showConfirmButton: false,
      timer: 1500
    });
  }
  function register() {
    window.document
      .getElementById("registerForm")
      .addEventListener("click", function(event) {
        event.preventDefault();
      });
    document.password = md5(document.password);
    if (
      Object.keys(document).length > 1 &&
      Object.values(document).every(x => x !== undefined && x != "")
    ) {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(document)
      })
        .then(res => res.json())
        .then(data => {
          $jsonData = [...$jsonData, data];
          window.location.href = "/";
        })
        .catch(err => {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Error en el registro",
            showConfirmButton: false,
            timer: 1500
          });
        });
    }
    getCount();
  }
  function login() {
    fetch(URL.users + document.nick, {
      method: "GET"
    })
      .then(res => res.json())
      .then(data => {
        if (
          data.nick == document.nick &&
          data.password == md5(document.password)
        ) {
          user.data = data;
          getCount();
          toggle();
          clearData();
        } else {
          alert("Datos incorrectos");
        }
      })
      .catch(err => {
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error al acceder",
          showConfirmButton: false,
          timer: 1500
        });
        clearData();
      });
  }
  function logout() {
    user.data = {};
    toggle();
    window.location.href = "/";
  }

  function forgot() {
    fetch(URL.users + document.nick, {
      method: "GET"
    })
      .then(res => res.json())
      .then(data => {
        if (data.nick == document.nick) {
          user.data = {};
          user.data.nick = data.nick;
          user.data.email = data.email;
          toggleShowForForgot();
          $progress = 50;
        } else {
          Swal.fire({
            position: "center",
            icon: "error",
            title: "Usuario no válido",
            showConfirmButton: true
          });
        }
      })
      .catch(err =>
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error",
          showConfirmButton: true
        })
      );
  }

  function newPass() {
    let finalPassword;

    if (document[0] == document[1]) {
      finalPassword = document[0];
      if (finalPassword.length < 8) {
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Error, la contraseña es demasiado corta",
          showConfirmButton: true
        });
      } else {
        $progress = 75;
        window.document
          .getElementById("passForm")
          .addEventListener("click", function(event) {
            event.preventDefault();
          });
        Swal.fire({
          position: "center",
          icon: "success",
          title:
            "Te hemos enviado un correo de confirmación a " +
            getCensuredEmail(),
          showConfirmButton: true
        });
        toggleShowForForgot();
        clearData();
        clearPasswds();
        $progress = 100;
      }
    } else {
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Error, las contraseñas no coinciden",
        showConfirmButton: true
      });
    }
  }

  function getCensuredEmail() {
    let censuredEmail = "";
    let finalIncognit = [];
    finalIncognit[0] = "";
    finalIncognit[1] = "";
    let email = user.data.email;
    let fragmentedEmail = email.split("@");
    let fragmentedDomain = fragmentedEmail[1].split(".");
    let incognit = fragmentedEmail[0].substring(1);
    for (let i = 0; i < incognit.length; i++) {
      finalIncognit[0] += "*";
    }
    for (let i = 0; i < fragmentedDomain[0].length; i++) {
      finalIncognit[1] += "*";
    }
    censuredEmail =
      fragmentedEmail[0].charAt(0) +
      finalIncognit[0] +
      "@" +
      finalIncognit[1] +
      "." +
      fragmentedDomain[1];
    return censuredEmail;
  }
</script>

<style>
  .btn-addToCart::after {
    content: "Añadir al carrito";
  }

  .btn-register::after {
    content: "Registrarse";
  }

  .btn-login::after {
    content: "Login";
  }

  .btn-logout::after {
    content: "Logout";
  }

  .btn-deleteCart::after {
    content: "Eliminar";
  }

  .btn-purchase::after {
    content: "Realizar compra";
  }

  .btn-forgot::after {
    content: "Next";
  }

  .btn-newPass::after {
    content: "Next";
  }
</style>

<button
  data-dismiss={dataDismiss}
  type={btnType}
  class={classes}
  on:click={handler} />
