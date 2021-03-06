import { ajax } from '../ajax-utils/ajax'
import loadFileFromPC from '../files-loader/load-file-from-pc'
import { commonUtils } from '../common-utils/utils'


var carousel = {
    activateClickEventListeners: function () {
        var superThis = this
        $(document).ready(function () {
            $(".carousel-submit-button").click(() => {
                superThis.carouselSubmit()
            })
            $('.carousel-inner').delegate('#canvas1', 'click', function (event) {
                $('.reconstruction-no-points').remove()
                superThis.reconstructionCoords.push({
                    x: event.offsetX,
                    y: event.offsetY
                })
                $('#reconstruction-points-container').append(`<li>x: ${event.offsetX} y: ${event.offsetY}</li>`)
            })
            $("#processing-button").click(() => {
                if ($('#kmeans-button').css('background-color') == 'rgb(33, 165, 34)') {
                    const clustersNumber = $("input[type=number][name='kmeans']").val()
                    let fileName = loadFileFromPC.getLoadedFileName()
                    const params = { fileName, clustersNumber }
                    const url = '/kmeans/step1'
                    superThis.generateCarousel(params, clustersNumber, url)
                }
            })
            $("#processing-button").click(() => {
                if ($('#fuzzy-button').css('background-color') == 'rgb(33, 165, 34)') {
                    const clustersNumber = $("input[type=number][name='fuzzy']").val()
                    let fileName = loadFileFromPC.getLoadedFileName()
                    const params = { fileName, clustersNumber }
                    const url = '/fuzzy/step1'
                    superThis.generateCarousel(params, clustersNumber, url)
                }
            })
            $('.filters-list li').click(function () {
                $(this).css({ 'background-color': '#d09c00' })
                for (let i = 0; i < 5; i++) {
                    if (($(this).index() !== i) && ($(`.filters-list li:nth-child(${i + 1})`).css('background-color')) !== 'rgb(68, 66, 66)') {
                        $(`.filters-list li:nth-child(${i + 1})`).css({ 'background-color': 'rgb(68, 66, 66)' })
                    }
                }
                superThis.clickedFilterIndex = $(this).index()
                switch ($(this).index()) {
                    case 0:
                        superThis.modifyInput('make hidden')
                        $('.reconstruction-pts').removeClass('d-none')
                        $('.reconstruction-pts').addClass('d-flex')
                        $('#canvas1').css({ cursor: 'crosshair' })
                        break
                    case 2:
                        $('.carousel-input').val(null)
                        superThis.modifyInput('reset', null).modifyInput('make visible').modifyInput('set placeholder', 'Choose structural element size in px')
                        break
                    case 3:
                        superThis.modifyInput('reset', null).modifyInput('make visible').modifyInput('set placeholder', 'Choose structural element size in px')
                        break
                    default: superThis.modifyInput('make hidden')
                        break
                }
            })
        })
    },
    clickedFilterIndex: null,
    generateCarousel: function (params, clustersNumber, url) {
        var superThis = this

        ajax.sendGetRequest(url, params)
            .done(function (res) {
                console.log(res)
                commonUtils.deactivateSpinner()
                if (!$('#dicomImgModal').is(':visible')) $('#dicomImgModal').modal()
                superThis.feelCarouselWithData(res, clustersNumber)
            })
            .fail(function (err) {
                console.log(err)
            })
    },
    feelCarouselWithData: function (res, clustersNumber) {
        var superThis = this
        superThis.clusteredImages = res.arrayOfImgs

        res.arrayOfImgs.forEach((arrayImg, index) => {
            const m = cv.matFromArray(512, 512, cv.CV_8U, [].concat.apply([], arrayImg))
            let carouselElement
            let carouselItemIndicator

            if (index === 0) {
                carouselElement = superThis.activeSlideDOM.replace('#INDEX#', index).replace('#INDEX+1#', index + 1)
                carouselItemIndicator = superThis.activeItemIndicator.replace('#INDEX+1#', index + 1)
            }
            else {
                carouselElement = superThis.notActiveSlideDOM.replace('#INDEX#', index).replace('#INDEX+1#', index + 1)
                carouselItemIndicator = superThis.notActiveItemIndicator.replace('#INDEX+1#', index + 1)
            }

            $('.carousel-inner').append(carouselElement)
            $('.carousel-indicators').append(carouselItemIndicator)
            $(".carousel-item").css({ 'width': '100%', 'height': '600px' })

            cv.imshow(`canvas${index}`, m);

        })
        superThis.activateCarousel(clustersNumber)
        $('#dicomImgModal').modal()
    },
    resetCarousel: function () {
        const superThis = this
        $('.carousel-container').html(superThis.emptyCarouselHTML)
        $('.carousel-container').html()
        superThis.modifyInput('reset', null).modifyInput('make visible').modifyInput('set placeholder', '"Image number (example: 2)"')
        $('.carousel-input').attr('name','step1')
        $('.processing-filters').css({ 'display': 'none'})
        $('#reconstruction-points-container').append(`<div class="reconstruction-no-points">no points choosen.</div>`)
        $('.carousel-modal-title').text('Step1: select one clustered image for further processing.')
        
    },
    carouselSubmit: function () {
        var superThis = this
        if ($('.carousel-input').attr('name') === 'step2') {
            console.log('KMEANS STEP3')
            this.appendColours()
            let filterNumber = superThis.clickedFilterIndex
            let initPayload = { filterNumber: filterNumber + 1, imgNumber: superThis.choosenImageNumber - 1 }
            let finalPayload
            let seSize
            let case4 = false
            console.log(filterNumber)
            switch (filterNumber) {
                case 0: finalPayload = Object.assign(initPayload, { reconstructionCoords: superThis.reconstructionCoords })
                    break
                case 1: finalPayload = initPayload
                    break
                case 2:
                    seSize = superThis.readInputValue()
                    finalPayload = Object.assign(initPayload, { seSize })
                    break
                case 3:
                    seSize = superThis.readInputValue()
                    finalPayload = Object.assign(initPayload, { seSize })
                    break
                case 4:
                    case4 = true
                    console.log('case4')
                    $('#dicomImgModal').modal('hide')
                    cv.imshow('canvasOutput', superThis.focusedImage)

                    let label
                    let x
                    let y
                    const canvas = document.getElementById('canvasOutput')
                    const ctx = canvas.getContext("2d")
                    const organs = superThis.processingResponse.response[1]
                    ctx.fillStyle = "#fb0"
                    ctx.font = "bold 20px Arial"
                    ctx.fontWeight
                    ctx.textBaseline = "start"

                    organs.forEach(el => {
                        label = el.name
                        x = el.centroidX
                        y = el.centroidY
                        console.log(el, label)
                        ctx.fillText(label, x, y)
                    })
                    superThis.resetCarousel()
                    break

            }
            if (!case4) {
                let url = '/kmeans/step2'
                if ($('#fuzzy-button').css('background-color') == 'rgb(33, 165, 34)') url = '/fuzzy/step2'

                ajax.sendPostRequest(url, finalPayload)
                    .done(function (res) {
                        console.log(res)
                        superThis.processingResponse = res
                        commonUtils.deactivateSpinner()
                        if (!$('#dicomImgModal').is(':visible')) $('#dicomImgModal').modal()
                        const m = cv.matFromArray(512, 512, cv.CV_8U, [].concat.apply([], res.response[0]))
                        superThis.focusedImage = m
                        cv.imshow(`canvas1`, m)
                        superThis.choosenImageNumber = 1



                    })
                    .fail(function (err) {
                        console.log(err)
                    })
            }
        }
        else if ($('.carousel-input').attr('name') === 'step1') {
            console.log('KMEANS STEP2')

            superThis.modifyInput('make hidden', null)
            superThis.choosenImageNumber = $('.carousel-input').val()

            const m = cv.matFromArray(512, 512, cv.CV_8U, [].concat.apply([], superThis.clusteredImages[superThis.choosenImageNumber - 1]))
            superThis.focusedImage = m
            let carouselElement
            let carouselItemIndicator

            $('.carousel-modal-title').text('Step 2: select further processing filter number')
            $('.processing-filters').css({ 'display': 'inherit', 'color': 'white' })
            $('.carousel-input').attr('name', 'step2') //step detector

            var superThis = this
            carouselElement = this.activeSlideDOM.replace('#INDEX#', 1).replace('#INDEX+1#', 1)
            carouselItemIndicator = this.activeItemIndicator.replace('#INDEX+1#', 1)
            console.log(carouselElement)
            $('.carousel-inner').html(carouselElement)
            $('.carousel-indicators').html(carouselItemIndicator)
            $(".carousel-item").css({ 'width': '100%', 'height': '600px' })

            cv.imshow(`canvas1`, m)
            this.activateCarousel(1)
            $('#dicomImgModal').modal()
        }
    },
    activateCarousel: function (clustersNumber) {
        $("#dicom-images-carousel").carousel()

        // Enable Carousel Indicators
        for (let i = 1; i <= clustersNumber; i++) {
            $(`.item${i}`).click(function () {
                $("#dicom-images-carousel").carousel(i - 1)
            })
        }

        // Enable Carousel Controls
        $(".carousel-control-prev").click(function () {
            $("#dicom-images-carousel").carousel("prev")
        })
        $(".carousel-control-next").click(function () {
            $("#dicom-images-carousel").carousel("next")
        })

    },

    focusedImage: undefined,
    processingResponse: undefined,
    appendColours: function () {
        return $(".filters-list").find("li").filter(function () {
            return $(this).css("background-color") === "rgb(208, 156, 0)";
        })
    },
    modifyInput: function (option, text) {
        switch (option) {
            case 'make visible':
                $('.carousel-input').css({ 'visibility': 'visible' })
                return this
            case 'make hidden':
                $('.carousel-input').css({ 'visibility': 'hidden' })
                return this
            case 'set placeholder':
                $('.carousel-input').attr('placeholder', text)
                return this
            case 'reset':
                $('.carousel-input').val(null)
                return this
        }
    },
    readInputValue: function () {
        return $('.carousel-input').val()
    },
    clusteredImages: null,
    reconstructionCoords: [],
    choosenImageNumber: null,
    activeSlideDOM: `
    <div class='carousel-item active'" + ">
    <div class="slide-name" style='color:white;font-size:20px'>Cluster number: #INDEX+1#</div> 
    <canvas id='canvas#INDEX#'></canvas>
    </div>`,
    notActiveSlideDOM: `
    <div class='carousel-item'" + ">
            <div class="slide-name" style='color:white;font-size:20px'>Cluster number: #INDEX+1#</div>
            <canvas id='canvas#INDEX#'></canvas>
    </div>`,
    activeItemIndicator: `<li class='item#INDEX+1# active'" + "></li>`,
    notActiveItemIndicator: `<li class='item#INDEX+1#'" + "></li>`,
    emptyCarouselHTML: 
    `<div id="dicom-images-carousel" class="carousel slide">
    <!-- Indicators -->
    <ul class="carousel-indicators">
    </ul>
    <!-- The slideshow -->
    <div class="carousel-inner" style="text-align:center">
    </div>
    <!-- Left and right controls -->
    <a class="carousel-control-prev" href="#dicom-images-carousel">
      <span class="carousel-control-prev-icon"></span>
    </a>
    <a class="carousel-control-next" href="#dicom-images-carousel">
      <span class="carousel-control-next-icon"></span>
    </a>
  </div>`

}

export default (function () { carousel.activateClickEventListeners() }())
