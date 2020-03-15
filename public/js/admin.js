const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector('[name=productId]').value;
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  const producttElement = btn.closest('article');
  fetch(`/admin/product/${productId}`, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrf
    }
  })
  .then(result => {
    producttElement.parentNode.removeChild(producttElement)
    return result.json()
  })
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.log(err)
  })
}