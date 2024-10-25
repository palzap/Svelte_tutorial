<script>
    let showModal = true;
    let isPromo = true;
</script>

<div class="backdrop" class:promo={isPromo}>
    <div class="modal">
        <p>This is a placeholder!</p>
    </div>

</div>

<style>
    .backdrop {
        width: 100%;
        height: 100%;
        position: fixed;
        background: rgba(0, 0, 0, 0.5);
    }

    .modal {
        padding: 10px;
        border-radius: 10px;
        max-width: 400px;
        margin: 10% auto;
        text-align: center;
        background: white;
    }

    .promo .modal {
        background: #ff3e00;
        color: white;
    }
</style>