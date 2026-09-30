jQuery(document).ready(function($) {
    'use strict';

    // State Management
    const QuotationForm = {
        currentStep: 1,
        currentSubStep: '1a',
        basket: [],
        currentItem: {},
        editingItemId: null,
        uploadedFiles: [], // Store uploaded files as base64

        // Available colours - Use dynamic colours from config if available, otherwise fallback to hardcoded
        colours: (function() {
            const colours = (typeof quotationFormAjax !== 'undefined' && quotationFormAjax.config && quotationFormAjax.config.colours)
                ? quotationFormAjax.config.colours
                : [
                { name: 'White', category: 'Standard', hex: '#FFFFFF' },
                { name: 'Cream', category: 'Colour', hex: '#FFFDD0' },
                { name: 'Agate Grey', category: 'Colour', hex: '#B5B5B5' },
                { name: 'Anthracite Grey', category: 'Colour', hex: '#3E3E3E' },
                { name: 'Anthracite Grey Smooth', category: 'Colour', hex: '#383838' },
                { name: 'Balmoral', category: 'Colour', hex: '#8B4513' },
                { name: 'Basalt Grey', category: 'Colour', hex: '#4A4A4A' },
                { name: 'Black', category: 'Colour', hex: '#000000' },
                { name: 'Blue', category: 'Colour', hex: '#0066CC' },
                { name: 'Chartwell Green', category: 'Colour', hex: '#3C4F3B' },
                { name: 'Dark Green', category: 'Colour', hex: '#013220' },
                { name: 'Golden Oak', category: 'Colour', hex: '#B8860B' },
                { name: 'Grey', category: 'Colour', hex: '#808080' },
                { name: 'Irish Oak', category: 'Colour', hex: '#C19A6B' },
                { name: 'Light Oak', category: 'Colour', hex: '#D4A76A' },
                { name: 'Rosewood', category: 'Colour', hex: '#65000B' },
            ];

            // Debug logging
            console.log('=== COLOURS LOADED ===');
            console.log('Total colours:', colours.length);
            const colour1007 = colours.find(c => c.name === '1007');
            console.log('Colour 1007:', colour1007);
            if (colour1007) {
                console.log('1007 category:', colour1007.category);
                console.log('1007 finish_type:', colour1007.finish_type);
            }
            console.log('======================');

            return colours;
        })(),

        // Available glazing features - Use dynamic features from config if available
        glazingFeatures: (typeof quotationFormAjax !== 'undefined' && quotationFormAjax.config && quotationFormAjax.config.glazingFeatures)
            ? quotationFormAjax.config.glazingFeatures
            : [],

        // Available hardware colours - Use dynamic colours from config if available
        hardwareColours: (typeof quotationFormAjax !== 'undefined' && quotationFormAjax.config && quotationFormAjax.config.hardwareColours)
            ? quotationFormAjax.config.hardwareColours
            : [
                { label: 'White', value: 'white', hex: '#FFFFFF' },
                { label: 'Chrome', value: 'chrome', hex: '#C0C0C0' },
                { label: 'Gold', value: 'gold', hex: '#FFD700' },
                { label: 'Black', value: 'black', hex: '#000000' }
            ],

        // Available cill options - Use dynamic options from config if available
        cillOptions: (typeof quotationFormAjax !== 'undefined' && quotationFormAjax.config && quotationFormAjax.config.cillOptions)
            ? quotationFormAjax.config.cillOptions
            : [
                { label: '150mm Sill', value: '150mm' },
                { label: '200mm Sill', value: '200mm' },
                { label: 'No Sill', value: 'none' }
            ],

        // Available openings - Use dynamic openings from config if available
        openings: (typeof quotationFormAjax !== 'undefined' && quotationFormAjax.config && quotationFormAjax.config.openings)
            ? quotationFormAjax.config.openings
            : [],

        debugColours: function() {
            console.log('=== COLOUR DEBUG INFO ===');
            console.log('Total colours:', this.colours.length);
            console.log('Sample colour data:', this.colours[0]);
            console.log('Colours with images:', this.colours.filter(c => c.colour_image && c.colour_image.url).length);
            if (this.colours.length > 0) {
                this.colours.forEach((colour, index) => {
                    if (colour.colour_image && colour.colour_image.url) {
                        console.log(`Colour ${index} "${colour.name}" has image:`, colour.colour_image.url);
                    }
                });
            }
            console.log('=========================');
        },

        // Capitalize text values for display (converts "low-e-double" to "Low E Double")
        capitalizeValue: function(text) {
            if (!text || text === '') {
                return text;
            }

            // Replace hyphens and underscores with spaces
            text = text.replace(/[-_]/g, ' ');

            // Capitalize each word
            text = text.toLowerCase().replace(/\b\w/g, function(char) {
                return char.toUpperCase();
            });

            return text;
        },

        saveState: function() {
            const state = {
                currentStep: this.currentStep,
                currentSubStep: this.currentSubStep,
                basket: this.basket,
                currentItem: this.currentItem
            };
            try {
                localStorage.setItem('quotationFormState', JSON.stringify(state));
            } catch (e) {
                console.error('Failed to save state:', e);
            }
        },

        loadState: function() {
            try {
                const savedState = localStorage.getItem('quotationFormState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    this.currentStep = state.currentStep || 1;
                    this.currentSubStep = state.currentSubStep || '1a';
                    this.basket = state.basket || [];
                    this.currentItem = state.currentItem || {};
                    return true;
                }
            } catch (e) {
                console.error('Failed to load state:', e);
            }
            return false;
        },

        clearState: function() {
            try {
                localStorage.removeItem('quotationFormState');
            } catch (e) {
                console.error('Failed to clear state:', e);
            }
        },

        // Postcode validation for service area
        postcodeValidation: {
            // Service area outward codes
            allowedPostcodes: new Set([
                // Berkshire
                'SL4','SL5','RG40','RG41','RG45',
                // Hampshire
                'RG21','RG22','RG23','RG24','RG25','RG27','RG29',
                'GU11','GU12','GU14','GU35','GU46','GU47','GU51','GU52',
                'GU30','GU31','GU32','GU33',
                // Surrey
                'GU6','GU7','GU8','GU9','GU10',
                'GU15','GU16','GU18','GU19','GU20',
                'GU21','GU22','GU23','GU24','GU25',
                'GU26','GU27','GU1','GU2','GU3','GU4','GU5',
                'KT11','KT12','KT13','KT14','KT15','KT16'
            ]),

            // UK postcode regex
            ukPostcodeRegex: /^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i,

            normalize: function(value) {
                return (value || '').toUpperCase().replace(/\s+/g, '').trim();
            },

            getOutwardCode: function(value) {
                const cleaned = this.normalize(value);
                return cleaned.length >= 4 ? cleaned.slice(0, cleaned.length - 3) : '';
            },

            validate: function(value) {
                const trimmed = (value || '').trim();
                if (!trimmed) {
                    return 'Please enter your postcode.';
                }
                if (!this.ukPostcodeRegex.test(trimmed)) {
                    return 'Please enter a valid UK postcode (e.g. GU21 4AA).';
                }
                const outward = this.getOutwardCode(trimmed);
                const isAllowed = Array.from(this.allowedPostcodes).some(code => outward.startsWith(code));
                if (!isAllowed) {
                    return 'Sorry—this postcode is outside our service area.';
                }
                return ''; // valid
            }
        },

        setupPostcodeValidation: function() {
            const self = this;
            const input = $('#customer-postcode')[0];
            if (!input || input.dataset.pcBound) return;

            input.dataset.pcBound = '1';

            const validatePostcode = function() {
                const errorMsg = self.postcodeValidation.validate(input.value);
                input.setCustomValidity(errorMsg);
                input.reportValidity();
            };

            // Real-time validation
            $(input).on('input blur', validatePostcode);
        },

        setupFileUpload: function() {
            const self = this;
            const $fileInput = $('#frame-images');
            const $filePreview = $('#file-preview');

            $fileInput.on('change', function(e) {
                const files = Array.from(e.target.files);

                // Only allow 1 file
                if (files.length === 0) {
                    return;
                }

                // Validate file size (max 1MB)
                const maxFileSize = 1 * 1024 * 1024; // 1MB in bytes
                const file = files[0]; // Only take the first file

                if (file.size > maxFileSize) {
                    alert('File is too large. Maximum file size is 1MB.');
                    this.value = '';
                    return;
                }

                // Convert file to base64
                self.uploadedFiles = [];
                const reader = new FileReader();
                reader.onload = function(e) {
                    self.uploadedFiles.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result
                    });
                    self.renderFilePreview();
                };
                reader.readAsDataURL(file);
            });
        },

        renderFilePreview: function() {
            const $preview = $('#file-preview');
            $preview.empty();

            this.uploadedFiles.forEach((file, index) => {
                const $fileItem = $('<div class="file-preview-item"></div>');
                $fileItem.append('<span>' + file.name + '</span>');
                $fileItem.append('<span class="remove-file" data-index="' + index + '">×</span>');
                $preview.append($fileItem);
            });

            // Bind remove file events
            const self = this;
            $('.remove-file').on('click', function() {
                const index = $(this).data('index');
                self.removeFile(index);
            });
        },

        removeFile: function(index) {
            this.uploadedFiles.splice(index, 1);
            this.renderFilePreview();

            // Clear the file input if no files remain
            if (this.uploadedFiles.length === 0) {
                $('#frame-images').val('');
            }
        },

        captureAttribution: function() {
            var params = new URLSearchParams(window.location.search);
            var fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'];
            for (var i = 0; i < fields.length; i++) {
                var val = params.get(fields[i]);
                if (val) {
                    $('#' + fields[i]).val(val);
                }
            }
            $('#landing_url').val(window.location.href);
            $('#referrer').val(document.referrer || '');
        },

        init: function() {
            this.glazingTypeHidden = false; // Initialize glazing type visibility state
            this.glazingFeaturesHidden = false; // Initialize glazing features visibility state
            this.captureAttribution();
            this.debugColours(); // Debug colour data
            this.loadState(); // Restore saved state if available
            this.bindEvents();
            this.initializeColourPickers();
            this.initializeGlazingTypePicker();
            this.initializeGlazingFeaturesPicker();
            this.initializeHardwareColourPicker();
            this.setupPostcodeValidation(); // Setup postcode validation
            this.setupFileUpload(); // Setup file upload handling
            // Render basket first (updates count before showing)
            if (this.basket.length > 0) {
                this.renderBasket();
            }

            // Then show basket (already has correct count)
            this.showBasketReview();

            this.updateNavigationButtons();
            this.updateProgressIndicator();
        },

        bindEvents: function() {
            const self = this;

            // Category selection (Step 1A)
            $('.card-grid.category-grid .image-card').on('click', function() {
                const category = $(this).data('category');

                // Clear downstream selections if category changed
                if (self.currentItem.category !== category) {
                    self.clearDownstreamSelections('category');
                }

                self.currentItem.category = category;
                self.selectCard($(this));
                self.navigateToSubStep('1b-' + category);
            });

            // Type selection (Step 1B)
            $('.card-grid.type-grid .image-card').on('click', function() {
                const type = $(this).data('type');

                // Clear downstream selections if type changed
                if (self.currentItem.type !== type) {
                    self.clearDownstreamSelections('type');
                }

                self.currentItem.type = type;
                self.currentItem.typeName = $(this).find('h3').text();
                self.selectCard($(this));

                // Dynamically determine if material selection is needed
                const hasMaterialsAvailable = self.checkMaterialsAvailable(type);

                if (hasMaterialsAvailable) {
                    // Navigate to material selection
                    self.navigateToSubStep('1c-material');
                } else {
                    // No materials available, skip to Step 2 (Style)
                    self.currentItem.material = 'N/A';
                    self.currentItem.materialName = 'N/A';
                    self.navigateToStep(2);
                }
            });

            // Material selection (Step 1C)
            $('.card-grid.material-grid .image-card').on('click', function() {
                const material = $(this).data('material');

                // Clear downstream selections if material changed
                if (self.currentItem.material !== material) {
                    self.clearDownstreamSelections('material');
                }

                self.currentItem.material = material;
                self.currentItem.materialName = $(this).find('h3').text();
                self.selectCard($(this));
                self.navigateToStep(2);
            });

            // Aluminium colour type selection (Stock vs Special)
            $('.aluminium-type-card').on('click', function() {
                const aluminiumType = $(this).data('aluminium-type');
                self.currentItem.aluminiumColourType = aluminiumType;
                $('#aluminium-colour-type').val(aluminiumType);

                // Visual selection
                $('.aluminium-type-card').removeClass('selected');
                $(this).addClass('selected');

                // Handle Stock vs Special
                self.handleAluminiumColourType(aluminiumType);
            });

            // Style selection (Step 2)
            $('.card-grid.style-grid .image-card').on('click', function() {
                const style = $(this).data('style');

                // Clear downstream selections if style changed
                if (self.currentItem.style !== style) {
                    self.clearDownstreamSelections('style');
                }

                self.currentItem.style = style;
                self.currentItem.styleName = $(this).find('h3').text();
                self.currentItem.styleImage = $(this).find('img').attr('src');
                self.selectCard($(this));

                // Update dimension limits based on selected style
                self.updateDimensionLimits(style);

                // Generate segment width fields for bay windows with sided styles
                var segmentCount = self.getSegmentCount();
                self.generateSegmentWidthFields(segmentCount);

                // Check if glazing options should be hidden for this style
                const hideGlazing = $(this).data('hide-glazing') === '1' || $(this).data('hide-glazing') === 1;
                self.toggleGlazingTypeVisibility(hideGlazing);
                self.toggleGlazingFeaturesVisibility(hideGlazing);

                // Check if infill panel should be shown for this style (Glazed Doors with midrails)
                const showInfillPanel = $(this).data('show-infill-panel') === '1' || $(this).data('show-infill-panel') === 1;
                self.currentItem.showInfillPanel = showInfillPanel;
                self.toggleInfillPanelVisibility(showInfillPanel);

                // Check if current product type has openings
                setTimeout(function() {
                    if (self.hasOpeningsForCurrentType()) {
                        self.showOpeningSelection();
                    } else {
                        self.navigateToStep(3);
                        self.updateConfigurationPreview();
                    }
                }, 300);
            });

            // Configuration: Add to Basket
            $('#add-to-basket-btn').on('click', function() {
                if (self.validateConfiguration()) {
                    self.addItemToBasket();
                    self.showBasketReview();
                }
            });

            // Configuration: Restart
            $('#restart-btn').on('click', function() {
                if (confirm('Are you sure you want to restart? All current item data will be lost.')) {
                    self.resetForm();
                }
            });

            // Basket: Add more items
            $('#add-more-items-btn').on('click', function() {
                self.currentItem = {};
                self.resetConfigurationForm(); // Clear all form state including uploadedFiles
                $('.image-card').removeClass('selected'); // Clear category/type/material/style selections
                self.navigateToStep(1);
                self.navigateToSubStep('1a');
            });

            // Basket: Proceed to review
            $('#proceed-to-review-btn').on('click', function() {
                if (self.basket.length === 0) {
                    alert('Please add at least one item to your basket.');
                    return;
                }
                self.navigateToStep(4);
                self.updateFinalSummary();
            });

            // Navigation buttons
            $('#prev-btn').on('click', function() {
                self.navigatePrevious();
            });

            $('#next-btn').on('click', function() {
                self.navigateNext();
            });

            // Form submission
            $('#quotation-form').on('submit', function(e) {
                e.preventDefault();
                self.submitForm();
            });

            // Colour picker search
            $('#inside-colour-search, #outside-colour-search').on('input', function() {
                const searchTerm = $(this).val().toLowerCase();
                const gridId = $(this).attr('id').replace('-search', '-grid');
                self.filterColours(gridId, searchTerm);
            });

            // Glazing features search
            $('#glazing-features-search').on('input', function() {
                const searchTerm = $(this).val().toLowerCase();
                self.filterGlazingFeatures('glazing-features-grid', searchTerm);
            });

            // Modal close
            $('.modal-close, .modal-cancel').on('click', function() {
                $('#edit-item-modal').hide();
            });

            // Progress indicator click
            $('.progress-step').on('click', function() {
                const step = $(this).data('step');

                // Allow clicking on basket at any time
                if (step === 'basket') {
                    self.showBasketReview();
                    return;
                }

                const stepNum = parseInt(step);

                // Don't allow navigation to Product, Style, or Configuration steps (1, 2, 3)
                // when in Review step (4) or Basket - these steps would be empty
                if (self.currentStep === 4 || self.currentStep === 'basket') {
                    if (stepNum <= 3) {
                        return; // Prevent navigation
                    }
                }

                if (stepNum < self.currentStep) {
                    self.navigateToStep(stepNum);
                }
            });
        },

        selectCard: function($card) {
            $card.addClass('selected').siblings().removeClass('selected');
        },

        /**
         * Clear downstream selections when a user changes their selection at a specific level
         * This prevents data corruption from mixed selections
         */
        clearDownstreamSelections: function(level) {
            // Clear based on hierarchy: category > type > material > style > opening > configuration

            if (level === 'category') {
                // Clear type and everything below
                delete this.currentItem.type;
                delete this.currentItem.typeName;
                $('.type-grid .image-card').removeClass('selected');
                level = 'type'; // Fall through to clear type's downstream
            }

            if (level === 'type') {
                // Clear material and everything below
                delete this.currentItem.material;
                delete this.currentItem.materialName;
                $('.material-grid .image-card').removeClass('selected');
                level = 'material'; // Fall through to clear material's downstream
            }

            if (level === 'material') {
                // Clear style and everything below
                delete this.currentItem.style;
                delete this.currentItem.styleName;
                delete this.currentItem.styleImage;
                $('.style-grid .image-card').removeClass('selected');
                level = 'style'; // Fall through to clear style's downstream
            }

            if (level === 'style') {
                // Clear opening and everything below
                delete this.currentItem.opening;
                delete this.currentItem.openingName;
                delete this.currentItem.openingImage;
                $('.opening-card').removeClass('selected');
                level = 'opening'; // Fall through to clear opening's downstream
            }

            if (level === 'opening') {
                // Clear all configuration data
                this.resetConfigurationForm();
                delete this.currentItem.width;
                delete this.currentItem.height;
                delete this.currentItem.cill;
                delete this.currentItem.insideColour;
                delete this.currentItem.outsideColour;
                delete this.currentItem.aluminiumColourType;
                delete this.currentItem.glazingType;
                delete this.currentItem.glazingTypeName;
                delete this.currentItem.glazingPattern;
                delete this.currentItem.glazingFeatures;
                delete this.currentItem.glazingFeaturesName;
                delete this.currentItem.hardwareColour;
                delete this.currentItem.hardwareColourName;
                this.uploadedFiles = [];
            }
        },

        /**
         * Check if materials are available for a given product type
         */
        checkMaterialsAvailable: function(productType) {
            const config = (typeof quotationFormAjax !== 'undefined' && quotationFormAjax.config) ? quotationFormAjax.config : {};
            const materials = config.materials || [];

            console.log('Checking materials for type:', productType);
            console.log('Total materials:', materials.length);

            // Check if any materials are available for this product type
            for (let i = 0; i < materials.length; i++) {
                const material = materials[i];
                const availableTypes = material.available_types || [];

                console.log('Material:', material.name, 'Available types:', availableTypes);

                // If no types specified, available for all
                if (availableTypes.length === 0 || availableTypes.includes(productType)) {
                    console.log('Found available material:', material.name);
                    return true;
                }
            }

            console.log('No materials available for this type');
            return false;
        },

        /**
         * Check if a material/style is available for current product type
         */
        isItemAvailableForProduct: function(availableTypes) {
            const currentType = this.currentItem.type;

            // Parse JSON if needed
            if (typeof availableTypes === 'string') {
                try {
                    availableTypes = JSON.parse(availableTypes);
                } catch (e) {
                    availableTypes = [];
                }
            }

            // If no restrictions, show for all
            if (!availableTypes || !Array.isArray(availableTypes) || availableTypes.length === 0) {
                return true;
            }

            // Check if current type is in the available types list
            return availableTypes.includes(currentType);
        },

        /**
         * Check if item is available for current material selection
         */
        isItemAvailableForMaterial: function(availableMaterials) {
            const currentMaterial = this.currentItem.material || '';

            // Parse JSON if needed
            if (typeof availableMaterials === 'string') {
                try {
                    availableMaterials = JSON.parse(availableMaterials);
                } catch (e) {
                    availableMaterials = [];
                }
            }

            // If no restrictions, show for all materials
            if (!availableMaterials || !Array.isArray(availableMaterials) || availableMaterials.length === 0) {
                return true;
            }

            // Check if current material is in the available materials list
            return availableMaterials.includes(currentMaterial);
        },

        /**
         * Filter materials/styles based on current product selection
         */
        filterItemsForProduct: function($container) {
            const self = this;

            $container.find('.image-card').each(function() {
                const $card = $(this);
                const availableTypes = $card.data('available-types');
                const availableMaterials = $card.data('available-materials');

                // Check both type and material availability
                const isTypeAvailable = self.isItemAvailableForProduct(availableTypes);
                const isMaterialAvailable = self.isItemAvailableForMaterial(availableMaterials);

                if (isTypeAvailable && isMaterialAvailable) {
                    $card.show();
                } else {
                    $card.hide();
                }
            });
        },

        navigateToSubStep: function(substep) {
            this.currentSubStep = substep;

            // Hide all sub-steps in current step
            $('.form-step[data-step="1"] .sub-step').removeClass('active');

            // Show the target sub-step
            const $targetSubstep = $('.sub-step[data-substep="' + substep + '"]');
            $targetSubstep.addClass('active');

            // Filter materials if navigating to material selection
            if (substep.startsWith('1c-material')) {
                this.filterItemsForProduct($targetSubstep.find('.material-grid'));
            }

            this.updateNavigationButtons();
            this.saveState(); // Save state after navigation

            // Scroll disabled per user request
            // setTimeout(function() {
            //     $('html, body').animate({ scrollTop: 0 }, 300);
            // }, 50);
        },

        navigateToStep: function(step) {
            this.currentStep = step;

            // Clean up opening selection UI when leaving step 2
            // Only remove UI elements, but keep the opening data when moving forward to configuration
            if (this.currentStep !== 2 && $('.opening-grid').length > 0) {
                $('.opening-grid').remove();
                $('.opening-back-btn').parent().remove();
                $('.style-grid').show();
                $('.form-step[data-step="2"] h2').text('Select Configuration Style');
                // Don't delete opening data here - it's needed for the configuration preview
                // Opening data is only cleared when going back via hideOpeningSelection()
            }

            // Handle basket vs regular steps
            if (step === 'basket') {
                $('.form-step').removeClass('active');
                $('.form-step.basket-review').addClass('active');
            } else {
                $('.form-step').removeClass('active');
                const $targetStep = $('.form-step[data-step="' + step + '"]');
                $targetStep.addClass('active');

                // Filter styles if navigating to step 2
                if (step === 2) {
                    this.filterItemsForProduct($targetStep.find('.style-grid'));
                }

                // Handle aluminium material in configuration step
                if (step === 3) {
                    this.handleAluminiumMaterialConfiguration();
                }
            }

            this.updateProgressIndicator();
            this.updateNavigationButtons();
            this.saveState(); // Save state after navigation

            // Scroll disabled per user request
            // setTimeout(function() {
            //     $('html, body').animate({ scrollTop: 0 }, 300);
            // }, 50);
        },

        navigatePrevious: function() {
            if (this.currentStep === 'basket') {
                this.navigateToStep(3);
            } else if (this.currentStep === 4) {
                this.showBasketReview();
            } else if (this.currentStep === 3) {
                this.navigateToStep(2);
            } else if (this.currentStep === 2) {
                this.navigateToStep(1);
            } else if (this.currentStep === 1) {
                // Handle sub-steps backward navigation
                this.navigateSubStepBackward();
            }
        },

        navigateNext: function() {
            // Next is typically automatic via card selection
            // This can be used for validation steps if needed
        },

        navigateSubStepBackward: function() {
            const currentSubstep = $('.sub-step.active').data('substep');

            if (currentSubstep && currentSubstep.startsWith('1c')) {
                // From material back to type
                const category = this.currentItem.category;
                this.navigateToSubStep('1b-' + category);
            } else if (currentSubstep && currentSubstep.startsWith('1b')) {
                // From type back to category
                this.navigateToSubStep('1a');
            }
        },

        updateProgressIndicator: function() {
            const currentStep = this.currentStep;

            $('.progress-step').each(function() {
                const stepData = $(this).data('step');

                // Handle basket step separately - it's always clickable
                if (stepData === 'basket') {
                    // Always keep clickable class
                    $(this).addClass('clickable');

                    if (currentStep === 'basket') {
                        $(this).addClass('active').removeClass('completed');
                    } else {
                        $(this).removeClass('active completed');
                    }
                    return;
                }

                const stepNum = parseInt(stepData);
                if (isNaN(stepNum)) return; // Skip if not a valid number

                if (stepNum < currentStep && currentStep !== 'basket') {
                    $(this).addClass('completed').removeClass('active');
                } else if (stepNum === currentStep) {
                    $(this).addClass('active').removeClass('completed');
                } else {
                    $(this).removeClass('active completed');
                }
            });
        },

        updateNavigationButtons: function() {
            const $prevBtn = $('#prev-btn');
            const $nextBtn = $('#next-btn');
            const $submitBtn = $('#submit-btn');
            const $submitDisclaimer = $('#submit-disclaimer');

            // Hide all by default
            $prevBtn.hide();
            $nextBtn.hide();
            $submitBtn.hide();
            $submitDisclaimer.hide();

            if (this.currentStep === 1) {
                // Show back button if not on first sub-step
                if (this.currentSubStep !== '1a') {
                    $prevBtn.show();
                }
            } else if (this.currentStep === 'basket') {
                // Hide back button on basket step
                $prevBtn.hide();
            } else if (this.currentStep === 4) {
                $prevBtn.show();
                $submitBtn.show();
                $submitDisclaimer.show();
            } else {
                $prevBtn.show();
            }
        },

        initializeColourPickers: function() {
            // Composite Doors relabel the two grids to Door / Frame and fix inside to White.
            const isComposite = (this.currentItem.type || '').toLowerCase() === 'composite-doors';
            if (isComposite) {
                $('.outside-colour-label').text('Door Colour');
                $('.inside-colour-label').text('Frame Colour');
                $('.composite-inside-note').show();
            } else {
                $('.outside-colour-label').text('Outside Colour');
                $('.inside-colour-label').text('Inside Colour');
                $('.composite-inside-note').hide();
            }

            this.renderColourGrid('inside-colour-grid');
            this.renderColourGrid('outside-colour-grid');

            // Select White as default colour for both inside and outside
            this.selectColour('outside-colour-grid', 'White', false);
            this.selectColour('inside-colour-grid', 'White', true);
        },

        renderColourGrid: function(gridId) {
            const self = this;
            const $grid = $('#' + gridId);
            const isInside = gridId.includes('inside');

            $grid.empty();

            // Filter colours by selected material (use material slug for comparison)
            const selectedMaterial = this.currentItem.material || '';
            let filteredColours = this.filterColoursByMaterial(selectedMaterial);

            // Composite Doors: outside grid = Door colours, inside grid = Frame colours.
            // All other products: exclude Door/Frame colours (composite-only) from the picker.
            const isComposite = (this.currentItem.type || '').toLowerCase() === 'composite-doors';
            if (isComposite) {
                const wantApplies = isInside ? 'Frame' : 'Door';
                filteredColours = filteredColours.filter(c => (c.applies_to || '') === wantApplies);
            } else {
                filteredColours = filteredColours.filter(c => !c.applies_to);
            }

            // Group by category
            const categories = {};
            filteredColours.forEach(colour => {
                if (!categories[colour.category]) {
                    categories[colour.category] = [];
                }
                categories[colour.category].push(colour);
            });

            // Render colours by category
            Object.keys(categories).forEach(category => {
                const $categoryGroup = $('<div class="colour-category"></div>');
                $categoryGroup.append('<h5>' + category + '</h5>');

                const $colourItems = $('<div class="colour-items"></div>');
                categories[category].forEach(colour => {
                    const $colourSwatch = $('<div class="colour-swatch" data-colour="' + colour.name + '" data-hex="' + colour.hex + '"></div>');

                    // Debug: Log colour data
                    console.log('Rendering colour:', colour.name, {
                        hasColourImage: !!(colour.colour_image),
                        hasColourImageUrl: !!(colour.colour_image && colour.colour_image.url),
                        colourImageData: colour.colour_image
                    });

                    // Check if colour has an image
                    if (colour.colour_image && colour.colour_image.url) {
                        // Use image instead of hex color
                        console.log('Using image for', colour.name, ':', colour.colour_image.url);
                        const $img = $('<img src="' + colour.colour_image.url + '" alt="' + colour.name + '" />');
                        $colourSwatch.addClass('has-image').append($img);
                    } else {
                        // Fall back to hex color
                        console.log('Using hex color for', colour.name, ':', colour.hex);
                        $colourSwatch.css('background-color', colour.hex);
                    }

                    $colourSwatch.attr('title', colour.name);

                    const $colourLabel = $('<span class="colour-label">' + colour.name + '</span>');

                    const $colourItem = $('<div class="colour-item"></div>');
                    $colourItem.append($colourSwatch).append($colourLabel);

                    $colourItem.on('click', function() {
                        const colourName = $(this).find('.colour-swatch').data('colour');
                        self.selectColour(gridId, colourName, isInside);
                    });

                    $colourItems.append($colourItem);
                });

                $categoryGroup.append($colourItems);
                $grid.append($categoryGroup);
            });
        },

        selectColour: function(gridId, colourName, isInside, colourCategory, clickedFinishType) {
            const prefix = isInside ? 'inside' : 'outside';

            // Update hidden fields
            $('#' + prefix + '-colour').val(colourName);
            $('#' + prefix + '-finish-type').val(clickedFinishType || '');

            // Find the colour object - for Aluminium Special Colours, also match finish type
            let colour;
            if (colourCategory === 'Aluminium Special Colours' && clickedFinishType) {
                // Match by name, category AND finish type to get the correct variant
                colour = this.colours.find(c => {
                    const ft = c.finish_type;
                    const matchesFinish = Array.isArray(ft) ? ft.includes(clickedFinishType) : ft === clickedFinishType;
                    return c.name === colourName &&
                           c.category === colourCategory &&
                           matchesFinish;
                });
            } else if (colourCategory) {
                // Match by name and category
                colour = this.colours.find(c => c.name === colourName && c.category === colourCategory);
            } else {
                // Match by name only
                colour = this.colours.find(c => c.name === colourName);
            }
            let displayText = colourName;

            // Debug logging
            console.log('Selected colour:', colourName, 'Category:', colourCategory, 'Finish:', clickedFinishType);
            console.log('Colour object:', colour);
            if (colour) {
                console.log('Category:', colour.category);
                console.log('Finish type:', colour.finish_type);
            }

            // For aluminium special colours, prepend finish type (now single value from backend)
            if (colour && colour.category === 'Aluminium Special Colours' && colour.finish_type) {
                displayText = colour.finish_type + ' ' + colourName;
                console.log('Display text with finish type:', displayText);
            }

            // Update display
            $('#' + prefix + '-colour-name').text(displayText);

            // Update visual selection
            $('#' + gridId + ' .colour-item').removeClass('selected');
            if (colourCategory === 'Aluminium Special Colours' && clickedFinishType) {
                // For aluminium special colours, match by name, finish type AND category
                $('#' + gridId + ' .colour-item').filter(function() {
                    const $swatch = $(this).find('.colour-swatch');
                    return $swatch.data('colour') === colourName &&
                           $swatch.data('finish-type') === clickedFinishType &&
                           $swatch.data('category') === colourCategory;
                }).addClass('selected');
            } else {
                // For other colours, match by name only
                $('#' + gridId + ' .colour-item').filter(function() {
                    return $(this).find('.colour-swatch').data('colour') === colourName;
                }).addClass('selected');
            }
        },

        filterColours: function(gridId, searchTerm) {
            const $grid = $('#' + gridId);

            // Filter individual colour items
            $grid.find('.colour-item').each(function() {
                const colourData = $(this).find('.colour-swatch').data('colour');
                const colourName = String(colourData || '').toLowerCase();
                if (colourName.includes(searchTerm)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });

            // Hide/show finish type groups based on whether they have visible items
            $grid.find('.colour-category').each(function() {
                const $category = $(this);
                const visibleItems = $category.find('.colour-item:visible').length;

                if (visibleItems > 0) {
                    $category.show();
                } else {
                    $category.hide();
                }
            });
        },

        filterColoursByMaterial: function(material) {
            const typeSlug = (this.currentItem.type || '').toLowerCase();
            return this.filterColoursByMaterialAndType(material, typeSlug);
        },

        filterColoursByMaterialAndType: function(material, type) {
            const materialSlug = (material || '').toLowerCase();
            const typeSlug = (type || '').toLowerCase();

            return this.colours.filter(colour => {
                // Check material availability
                let materialMatches = true;
                if (colour.available_materials && colour.available_materials.length > 0) {
                    materialMatches = colour.available_materials.some(m => m.toLowerCase() === materialSlug);
                }

                // Check finish-specific exclusions (for fine-grained control)
                let finishMatches = true;
                if (colour.finish_exclusions && colour.finish_exclusions.length > 0 && typeSlug) {
                    // Check if there's a rule for this product type
                    const exclusionRule = colour.finish_exclusions.find(rule =>
                        rule.product_type && rule.product_type.toLowerCase() === typeSlug
                    );

                    if (exclusionRule && exclusionRule.excluded_finishes && exclusionRule.excluded_finishes.length > 0) {
                        // If this colour's finish type is in the excluded list, exclude it
                        const colourFinish = (colour.finish_type || '').toLowerCase();
                        const isExcluded = exclusionRule.excluded_finishes.some(f => f.toLowerCase() === colourFinish);
                        finishMatches = !isExcluded;
                    }
                }

                // Both conditions must be true
                return materialMatches && finishMatches;
            });
        },

        handleAluminiumColourType: function(aluminiumType) {
            // Reset colour selections when switching between Stock/Special
            $('#inside-colour').val('');
            $('#outside-colour').val('');
            $('#inside-colour-name').text('None');
            $('#outside-colour-name').text('None');
            $('.colour-item').removeClass('selected');

            // Clear currentItem colour values
            this.currentItem.insideColour = '';
            this.currentItem.outsideColour = '';

            // Clear search inputs
            $('#inside-colour-search').val('');
            $('#outside-colour-search').val('');

            if (aluminiumType === 'stock') {
                // Stock colours: Show form group and first colour section
                $('.form-group:has(.colour-selection)').show();
                $('.colour-selection').first().show(); // Show first (inside)
                $('.colour-selection').last().hide(); // Hide second (outside)
                $('.inside-colour-label').text('Select Colour');

                // Re-render grid with only stock colours
                this.renderAluminiumStockColours();
            } else if (aluminiumType === 'special') {
                // Special colours: Show both Inside/Outside sections, change labels
                $('.form-group:has(.colour-selection)').show();
                $('.colour-selection').show();
                $('.inside-colour-label').text('External');
                $('.outside-colour-label').text('Internal');

                // Re-render grids with only special colours
                this.renderAluminiumSpecialColours();
            }
        },

        renderAluminiumStockColours: function() {
            const self = this;
            const $grid = $('#inside-colour-grid');
            $grid.empty();

            // Filter colours by selected material first, then by category (use material slug for comparison)
            const selectedMaterial = this.currentItem.material || '';
            const materialFilteredColours = this.filterColoursByMaterial(selectedMaterial);
            const stockColours = materialFilteredColours.filter(c => c.category === 'Aluminium Stock Colours');

            const $colourItems = $('<div class="colour-items aluminium-stock-items"></div>');
            stockColours.forEach(colour => {
                const $colourSwatch = $('<div class="colour-swatch" data-colour="' + colour.name + '" data-category="' + colour.category + '" data-hex="' + colour.hex + '"></div>');

                if (colour.colour_image && colour.colour_image.url) {
                    const $img = $('<img src="' + colour.colour_image.url + '" alt="' + colour.name + '" />');
                    $colourSwatch.addClass('has-image').append($img);
                } else {
                    $colourSwatch.css('background-color', colour.hex);
                }

                $colourSwatch.attr('title', colour.name);
                const $colourLabel = $('<span class="colour-label">' + colour.name + '</span>');
                const $colourItem = $('<div class="colour-item"></div>');
                $colourItem.append($colourSwatch).append($colourLabel);

                $colourItem.on('click', function() {
                    const colourName = String($(this).find('.colour-swatch').data('colour'));
                    const colourCategory = $(this).find('.colour-swatch').data('category');
                    // Apply to both inside and outside
                    self.selectColour('inside-colour-grid', colourName, true, colourCategory);
                    self.selectColour('outside-colour-grid', colourName, false, colourCategory);
                    $('#inside-colour').val(colourName);
                    $('#outside-colour').val(colourName);
                    $('#inside-colour-name').text(colourName);
                    $('#outside-colour-name').text(colourName);
                });

                $colourItems.append($colourItem);
            });

            $grid.append($colourItems);
        },

        renderAluminiumSpecialColours: function() {
            const self = this;

            // Filter colours by selected material first, then by category (use material slug for comparison)
            const selectedMaterial = this.currentItem.material || '';
            const materialFilteredColours = this.filterColoursByMaterial(selectedMaterial);
            const specialColours = materialFilteredColours.filter(c => c.category === 'Aluminium Special Colours');

            // Render for both inside and outside grids
            ['inside-colour-grid', 'outside-colour-grid'].forEach(gridId => {
                const $grid = $('#' + gridId);
                const isInside = gridId.includes('inside');
                $grid.empty();

                // Group colours by finish type
                const finishTypes = {
                    'Matt': [],
                    'Gloss': [],
                    'Metallic': [],
                    'Satin': []
                };

                specialColours.forEach(colour => {
                    let finishTypesArray = [];

                    // Handle both array (multi-select) and string (old single select)
                    if (Array.isArray(colour.finish_type)) {
                        finishTypesArray = colour.finish_type.length > 0 ? colour.finish_type : ['Matt'];
                    } else if (colour.finish_type) {
                        finishTypesArray = [colour.finish_type];
                    } else {
                        finishTypesArray = ['Matt']; // Default
                    }

                    // Add colour to all selected finish types
                    finishTypesArray.forEach(ft => {
                        if (finishTypes[ft]) {
                            finishTypes[ft].push(colour);
                        }
                    });
                });

                // Render colours by finish type (similar to category grouping)
                Object.keys(finishTypes).forEach(finishType => {
                    if (finishTypes[finishType].length === 0) return; // Skip empty groups

                    const $finishGroup = $('<div class="colour-category"></div>');
                    $finishGroup.append('<h5>' + finishType.toUpperCase() + '</h5>');

                    const $colourItems = $('<div class="colour-items"></div>');
                    finishTypes[finishType].forEach(colour => {
                        const $colourSwatch = $('<div class="colour-swatch" data-colour="' + colour.name + '" data-category="' + colour.category + '" data-finish-type="' + finishType + '" data-hex="' + colour.hex + '"></div>');

                        // Use hex color only (no image for aluminium special colours)
                        $colourSwatch.css('background-color', colour.hex);
                        $colourSwatch.attr('title', colour.name);

                        const $colourLabel = $('<span class="colour-label">' + colour.name + '</span>');
                        const $colourItem = $('<div class="colour-item"></div>');
                        $colourItem.append($colourSwatch).append($colourLabel);

                        $colourItem.on('click', function() {
                            const colourName = String($(this).find('.colour-swatch').data('colour'));
                            const colourCategory = $(this).find('.colour-swatch').data('category');
                            const clickedFinishType = $(this).find('.colour-swatch').data('finish-type');
                            self.selectColour(gridId, colourName, isInside, colourCategory, clickedFinishType);
                        });

                        $colourItems.append($colourItem);
                    });

                    $finishGroup.append($colourItems);
                    $grid.append($finishGroup);
                });
            });
        },

        handleAluminiumMaterialConfiguration: function() {
            const material = this.currentItem.material || '';

            // Check if aluminium material is selected
            if (material.toLowerCase().includes('aluminium') || material.toLowerCase().includes('aluminum')) {
                // Show aluminium colour type selection
                $('.aluminium-colour-type-selection').show();

                // Default to Stock colours
                this.currentItem.aluminiumColourType = 'stock';
                $('#aluminium-colour-type').val('stock');

                // Select stock card by default
                $('.aluminium-type-card').removeClass('selected');
                $('.aluminium-type-card[data-aluminium-type="stock"]').addClass('selected');

                // Automatically show stock colours
                this.handleAluminiumColourType('stock');
            } else {
                // Hide aluminium colour type selection
                $('.aluminium-colour-type-selection').hide();

                // Show regular colour selection with normal labels
                $('.form-group:has(.colour-selection)').show();
                $('.colour-selection').show(); // Ensure both colour sections are visible
                $('.inside-colour-label').text('Inside Colour');
                $('.outside-colour-label').text('Outside Colour');

                // Render normal colours
                this.initializeColourPickers();
            }
        },

        initializeHardwareColourPicker: function() {
            this.renderHardwareColourGrid('hardware-colour-grid');
        },

        renderHardwareColourGrid: function(gridId) {
            const self = this;
            const $grid = $('#' + gridId);

            $grid.empty();

            // Render hardware colours (no categories, just a simple grid)
            const $colourItems = $('<div class="colour-items"></div>');

            this.hardwareColours.forEach(colour => {
                const colourName = colour.label || colour.name;
                const colourValue = colour.value || colour.label;
                const colourHex = colour.hex || '#CCCCCC';

                const $colourSwatch = $('<div class="colour-swatch" data-colour="' + colourValue + '" data-hex="' + colourHex + '"></div>');

                // Use hex color (no images for hardware colours)
                $colourSwatch.css('background-color', colourHex);
                $colourSwatch.attr('title', colourName);

                const $colourLabel = $('<span class="colour-label">' + colourName + '</span>');

                const $colourItem = $('<div class="colour-item"></div>');
                $colourItem.append($colourSwatch).append($colourLabel);

                $colourItem.on('click', function() {
                    const value = $(this).find('.colour-swatch').data('colour');
                    self.selectHardwareColour(value, colourName);
                });

                $colourItems.append($colourItem);
            });

            $grid.append($colourItems);
        },

        selectHardwareColour: function(colourValue, colourName) {
            // Update hidden field
            $('#hardware-colour').val(colourValue);

            // Update display
            $('#hardware-colour-name').text(colourName);

            // Update visual selection
            $('#hardware-colour-grid .colour-item').removeClass('selected');
            $('#hardware-colour-grid .colour-item').filter(function() {
                return $(this).find('.colour-swatch').data('colour') === colourValue;
            }).addClass('selected');
        },

        initializeGlazingTypePicker: function() {
            const self = this;

            // Bind click events to glazing type cards
            $('.glazing-type-card').on('click', function() {
                const glazingType = $(this).data('glazing-type');
                const glazingTypeName = $(this).find('.glazing-type-label').text();
                let patterns = $(this).data('patterns');

                // Normalize patterns - ensure it's an array, not a string
                if (typeof patterns === 'string') {
                    try { patterns = JSON.parse(patterns); } catch(e) { patterns = []; }
                }

                self.selectGlazingType(glazingType, glazingTypeName, patterns);
            });

            // Auto-select first glazing type on page load
            this.autoSelectFirstGlazingType();
        },

        autoSelectFirstGlazingType: function() {
            const $firstGlazingType = $('.glazing-type-card').first();

            console.log('Auto-selecting first glazing type...');
            console.log('Found glazing type cards:', $('.glazing-type-card').length);

            if ($firstGlazingType.length) {
                const glazingType = $firstGlazingType.data('glazing-type');
                const glazingTypeName = $firstGlazingType.find('.glazing-type-label').text();
                let patterns = $firstGlazingType.data('patterns');

                // Normalize patterns - ensure it's an array, not a string
                if (typeof patterns === 'string') {
                    try { patterns = JSON.parse(patterns); } catch(e) { patterns = []; }
                }

                console.log('Auto-selecting glazing type:', glazingType, glazingTypeName);
                console.log('Patterns:', patterns);

                this.selectGlazingType(glazingType, glazingTypeName, patterns);
            } else {
                console.warn('No glazing type cards found for auto-select');
            }
        },

        selectGlazingType: function(glazingType, glazingTypeName, patterns) {
            // Update hidden field
            $('#glazing-type').val(glazingType);

            // Store current glazing type name for pattern display
            this.currentGlazingTypeName = glazingTypeName;

            // Update display (will be updated again if pattern is selected)
            $('#glazing-type-name').text(glazingTypeName);

            // Update visual selection
            $('.glazing-type-card').removeClass('selected');
            $('.glazing-type-card[data-glazing-type="' + glazingType + '"]').addClass('selected');

            // Show/hide patterns based on availability
            if (patterns && patterns.length > 0) {
                this.renderGlazingPatterns(patterns);
                $('#glazing-pattern-group').show();
                // Select "Clear" pattern by default if it exists
                const clearPattern = patterns.find(p => p.value === 'Clear' || p.name === 'Clear');
                if (clearPattern) {
                    this.selectGlazingPattern(clearPattern.value || 'Clear', clearPattern.name || 'Clear');
                } else {
                    // Reset pattern selection if no Clear pattern
                    $('#glazing-pattern').val('');
                    $('.glazing-pattern-card').removeClass('selected');
                }
            } else {
                $('#glazing-pattern-group').hide();
                $('#glazing-pattern').val('');
            }
        },

        renderGlazingPatterns: function(patterns) {
            const self = this;
            const $grid = $('#glazing-pattern-grid');

            $grid.empty();

            patterns.forEach(pattern => {
                const patternName = pattern.name || '';
                const patternValue = pattern.value || '';
                const patternImage = pattern.image && pattern.image.url ? pattern.image.url : '';

                const $patternCard = $('<div class="glazing-pattern-card" data-pattern="' + patternValue + '"></div>');

                if (patternImage) {
                    const $patternImage = $('<div class="glazing-pattern-image"></div>');
                    $patternImage.css('background-image', 'url(' + patternImage + ')');
                    $patternCard.append($patternImage);
                }

                const $patternLabel = $('<div class="glazing-pattern-label">' + patternName + '</div>');
                $patternCard.append($patternLabel);

                $patternCard.on('click', function() {
                    const value = $(this).data('pattern');
                    self.selectGlazingPattern(value, patternName);
                });

                $grid.append($patternCard);
            });
        },

        selectGlazingPattern: function(patternValue, patternName) {
            // Update hidden field
            $('#glazing-pattern').val(patternValue);

            // Remember the pattern's display name for the basket/summary display
            this.currentGlazingPatternName = patternName || '';

            // Update display to include pattern name
            if (this.currentGlazingTypeName && patternName) {
                $('#glazing-type-name').text(this.currentGlazingTypeName + ' - ' + patternName);
            }

            // Update visual selection
            $('.glazing-pattern-card').removeClass('selected');
            $('.glazing-pattern-card[data-pattern="' + patternValue + '"]').addClass('selected');
        },

        initializeGlazingFeaturesPicker: function() {
            this.renderGlazingFeaturesGrid('glazing-features-grid');
        },

        renderGlazingFeaturesGrid: function(gridId) {
            const self = this;
            const $grid = $('#' + gridId);

            $grid.empty();

            // Add "Not Required" option first
            const $notRequiredCategory = $('<div class="glazing-feature-category"></div>');
            $notRequiredCategory.append('<h5>Not Required</h5>');

            const $notRequiredItems = $('<div class="glazing-feature-items"></div>');
            const $notRequiredItem = $('<div class="glazing-feature-item" data-feature="not-required"></div>');
            const $notRequiredSwatch = $('<div class="glazing-feature-swatch"></div>');
            $notRequiredSwatch.text('None');
            const $notRequiredLabel = $('<span class="glazing-feature-label">Not Required</span>');
            $notRequiredItem.append($notRequiredSwatch).append($notRequiredLabel);

            $notRequiredItem.on('click', function() {
                self.selectGlazingFeature('glazing-features-grid', 'not-required', 'Not Required');
            });

            $notRequiredItems.append($notRequiredItem);
            $notRequiredCategory.append($notRequiredItems);
            $grid.append($notRequiredCategory);

            // Group by category
            const categories = {};
            this.glazingFeatures.forEach(feature => {
                if (!categories[feature.category]) {
                    categories[feature.category] = [];
                }
                categories[feature.category].push(feature);
            });

            // Render features by category
            Object.keys(categories).forEach(category => {
                const $categoryGroup = $('<div class="glazing-feature-category"></div>');
                $categoryGroup.append('<h5>' + category + '</h5>');

                const $featureItems = $('<div class="glazing-feature-items"></div>');
                categories[category].forEach(feature => {
                    const $featureSwatch = $('<div class="glazing-feature-swatch" data-feature="' + feature.value + '"></div>');

                    // Check if feature has an image
                    if (feature.feature_image && feature.feature_image.url) {
                        const $img = $('<img src="' + feature.feature_image.url + '" alt="' + feature.name + '" />');
                        $featureSwatch.addClass('has-image').append($img);
                    } else {
                        $featureSwatch.text(feature.name);
                    }

                    $featureSwatch.attr('title', feature.name);

                    const $featureLabel = $('<span class="glazing-feature-label">' + feature.name + '</span>');

                    const $featureItem = $('<div class="glazing-feature-item"></div>');
                    $featureItem.append($featureSwatch).append($featureLabel);

                    $featureItem.on('click', function() {
                        self.selectGlazingFeature('glazing-features-grid', feature.value, feature.name);
                    });

                    $featureItems.append($featureItem);
                });

                $categoryGroup.append($featureItems);
                $grid.append($categoryGroup);
            });
        },

        selectGlazingFeature: function(gridId, featureValue, featureName) {
            // Update hidden field
            $('#glazing-features').val(featureValue);

            // Update display
            $('#glazing-features-name').text(featureName);

            // Update visual selection
            $('#' + gridId + ' .glazing-feature-item').removeClass('selected');
            $('#' + gridId + ' .glazing-feature-item').filter(function() {
                // Check both swatch data-feature and item data-feature (for "Not Required")
                return $(this).find('.glazing-feature-swatch').data('feature') === featureValue ||
                       $(this).data('feature') === featureValue;
            }).addClass('selected');
        },

        filterGlazingFeatures: function(gridId, searchTerm) {
            $('#' + gridId + ' .glazing-feature-item').each(function() {
                const featureName = $(this).find('.glazing-feature-label').text().toLowerCase();
                if (featureName.includes(searchTerm)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        },

        updateDimensionLimits: function(styleSlug) {
            // Get config
            const config = (typeof quotationFormAjax !== 'undefined' && quotationFormAjax.config) ? quotationFormAjax.config : {};
            const styles = config.styles || [];

            // Find the selected style
            const selectedStyle = styles.find(s => s.slug === styleSlug);

            // Default limits (fallback if style not found or no limits defined)
            let minWidth = 200;
            let maxWidth = 4000;
            let minHeight = 200;
            let maxHeight = 3200;

            // Use style-specific limits if available
            if (selectedStyle) {
                minWidth = selectedStyle.min_width || minWidth;
                maxWidth = selectedStyle.max_width || maxWidth;
                minHeight = selectedStyle.min_height || minHeight;
                maxHeight = selectedStyle.max_height || maxHeight;
            }

            // Update width input
            const $widthInput = $('#width');
            $widthInput.attr('min', minWidth);
            $widthInput.attr('max', maxWidth);
            $widthInput.next('.field-hint').text('Min: ' + minWidth + 'mm - Max: ' + maxWidth + 'mm');

            // Update height input
            const $heightInput = $('#height');
            $heightInput.attr('min', minHeight);
            $heightInput.attr('max', maxHeight);
            $heightInput.next('.field-hint').text('Min: ' + minHeight + 'mm - Max: ' + maxHeight + 'mm');
        },

        /**
         * Get the number of segments for bay window sided styles
         * Returns 0 if not a bay window or not a sided style
         */
        getSegmentCount: function() {
            var typeName = (this.currentItem.typeName || '').toLowerCase();
            var styleSlug = this.currentItem.style || '';

            // Only for bay windows
            if (!typeName.includes('bay window')) return 0;

            // Check if style is a "sided" variant (e.g., style-3-sided, style-9-sided)
            var match = styleSlug.match(/(\d+)-sided/);
            return match ? parseInt(match[1]) : 0;
        },

        /**
         * Get segment count from a basket item (for edit modal)
         */
        getSegmentCountFromItem: function(item) {
            var typeName = (item.typeName || '').toLowerCase();
            var styleSlug = item.style || '';

            if (!typeName.includes('bay window')) return 0;

            var match = styleSlug.match(/(\d+)-sided/);
            return match ? parseInt(match[1]) : 0;
        },

        /**
         * Generate segment width input fields for bay windows
         */
        generateSegmentWidthFields: function(count, existingValues) {
            var $container = $('#segment-widths-inputs');
            $container.empty();

            if (count > 0) {
                for (var i = 1; i <= count; i++) {
                    var val = (existingValues && existingValues[i - 1]) ? existingValues[i - 1] : '';
                    $container.append(
                        '<div class="segment-width-field">' +
                        '<label for="segment-width-' + i + '">Segment ' + i + ' Width (mm)</label>' +
                        '<input type="number" id="segment-width-' + i + '" class="segment-width-input" data-segment="' + i + '" min="1" value="' + val + '">' +
                        '</div>'
                    );
                }
                $('#segment-widths-group').show();
            } else {
                $('#segment-widths-group').hide();
            }
        },

        /**
         * Collect all segment width values from the form
         */
        collectSegmentWidths: function() {
            var widths = [];
            $('.segment-width-input').each(function() {
                widths.push($(this).val());
            });
            return widths;
        },

        toggleGlazingTypeVisibility: function(shouldHide) {
            const $glazingTypeGroup = $('.form-group').filter(function() {
                return $(this).find('label').first().text().trim() === 'Glazing Type';
            });

            if (shouldHide) {
                // Hide the glazing type section
                $glazingTypeGroup.hide();
                // Clear any selected glazing type
                $('#glazing-type').val('');
                $('#glazing-type-name').text('None');
                $('.glazing-type-card').removeClass('selected');
                // Mark that glazing type is hidden
                this.glazingTypeHidden = true;
            } else {
                // Show the glazing type section
                $glazingTypeGroup.show();
                // Re-auto-select first glazing type
                this.autoSelectFirstGlazingType();
                // Mark that glazing type is visible
                this.glazingTypeHidden = false;
            }
        },

        toggleGlazingFeaturesVisibility: function(shouldHide) {
            const $glazingFeaturesGroup = $('.form-group').filter(function() {
                return $(this).find('label').first().text().trim() === 'Glazing Features';
            });

            if (shouldHide) {
                // Hide the glazing features section
                $glazingFeaturesGroup.hide();
                // Clear any selected glazing features
                $('#glazing-features').val('');
                $('#glazing-features-name').text('Not Required');
                $('.glazing-feature-item').removeClass('selected');
                // Mark that glazing features is hidden
                this.glazingFeaturesHidden = true;
            } else {
                // Show the glazing features section
                $glazingFeaturesGroup.show();
                // Reset to default "Not Required" selection
                $('#glazing-features').val('not-required');
                $('#glazing-features-name').text('Not Required');
                // Mark that glazing features is visible
                this.glazingFeaturesHidden = false;
            }
        },

        toggleInfillPanelVisibility: function(shouldShow) {
            const typeName = (this.currentItem.typeName || '').toLowerCase();
            const isGlazedDoors = typeName.includes('glazed');
            const isFrenchDoors = typeName.includes('french');

            // Only show if both conditions are met: Glazed Doors or French Doors type AND style has midrail
            if (shouldShow && (isGlazedDoors || isFrenchDoors)) {
                $('.infill-panel-selection').show();
            } else {
                $('.infill-panel-selection').hide();
                $('#infill-panel').val(''); // Reset value when hidden
            }
        },

        updateConfigurationPreview: function() {
            $('#style-preview').attr('src', this.currentItem.styleImage);
            $('#preview-category').text(this.capitalizeValue(this.currentItem.category) || '');
            $('#preview-type').text(this.currentItem.typeName || '');
            $('#preview-material').text(this.currentItem.materialName || 'N/A');
            $('#preview-style').text(this.capitalizeValue(this.currentItem.styleName) || '');

            // Show Opening row only if opening is selected
            if (this.currentItem.openingName) {
                $('#preview-opening').text(this.currentItem.openingName);
                $('#preview-opening-row').show();
            } else {
                $('#preview-opening-row').hide();
            }

            // Show/hide Side Panels field for Composite Doors
            const typeName = (this.currentItem.typeName || '').toLowerCase();
            if (typeName.includes('composite door')) {
                $('.side-panels-selection').show();
            } else {
                $('.side-panels-selection').hide();
                $('#side-panels').val(''); // Reset value when hidden
            }

            // Show/hide Infill Panel field for Glazed Doors or French Doors with midrail styles
            if (this.currentItem.showInfillPanel && (typeName.includes('glazed') || typeName.includes('french'))) {
                $('.infill-panel-selection').show();
            } else {
                $('.infill-panel-selection').hide();
                $('#infill-panel').val(''); // Reset value when hidden
            }

        },

        validateConfiguration: function() {
            const $widthInput = $('#width');
            const $heightInput = $('#height');

            const width = parseInt($widthInput.val());
            const height = parseInt($heightInput.val());

            // Get dynamic min/max values from input attributes (set by updateDimensionLimits)
            const minWidth = parseInt($widthInput.attr('min')) || 200;
            const maxWidth = parseInt($widthInput.attr('max')) || 4000;
            const minHeight = parseInt($heightInput.attr('min')) || 200;
            const maxHeight = parseInt($heightInput.attr('max')) || 3200;

            const cill = $('#cill').val();
            const insideColour = $('#inside-colour').val();
            const outsideColour = $('#outside-colour').val();
            const glazingType = $('#glazing-type').val();
            const hardwareColour = $('#hardware-colour').val();

            if (!width || width < minWidth || width > maxWidth) {
                alert('Please enter a valid width (' + minWidth + '-' + maxWidth + 'mm)');
                return false;
            }

            if (!height || height < minHeight || height > maxHeight) {
                alert('Please enter a valid height (' + minHeight + '-' + maxHeight + 'mm)');
                return false;
            }

            if (!cill) {
                alert('Please select an external sub cill option');
                return false;
            }

            if (!insideColour) {
                alert('Please select an inside colour');
                return false;
            }

            if (!outsideColour) {
                alert('Please select an outside colour');
                return false;
            }

            // Only validate glazing type if it's not hidden
            if (!this.glazingTypeHidden && !glazingType) {
                alert('Please select a glazing type');
                return false;
            }

            if (!hardwareColour) {
                alert('Please select a hardware colour');
                return false;
            }

            // Validate segment widths for bay windows with sided styles
            var segmentCount = this.getSegmentCount();
            if (segmentCount > 0) {
                var segmentWidths = this.collectSegmentWidths();
                for (var i = 0; i < segmentCount; i++) {
                    var sw = parseInt(segmentWidths[i]);
                    if (!sw || sw < 1) {
                        alert('Please enter a valid width for Segment ' + (i + 1));
                        return false;
                    }
                }
            }

            return true;
        },

        addItemToBasket: function() {
            const item = {
                id: this.editingItemId || 'item-' + Date.now(),
                timestamp: Date.now(),
                category: this.currentItem.category,
                type: this.currentItem.type,
                typeName: this.currentItem.typeName,
                material: this.currentItem.material,
                materialName: this.currentItem.materialName,
                style: this.currentItem.style,
                styleName: this.currentItem.styleName,
                styleImage: this.currentItem.styleImage,
                width: $('#width').val(),
                height: $('#height').val(),
                cill: $('#cill').val(),
                cillName: $('#cill option:selected').text(),
                sidePanels: $('#side-panels').val() || '',
                infillPanel: $('#infill-panel').val() || '',
                insideColour: $('#inside-colour').val(),
                outsideColour: $('#outside-colour').val(),
                insideColourName: $('#inside-colour-name').text(),
                outsideColourName: $('#outside-colour-name').text(),
                insideFinishType: $('#inside-finish-type').val(),
                outsideFinishType: $('#outside-finish-type').val(),
                aluminiumColourType: this.currentItem.aluminiumColourType || '',
                glazingPattern: $('#glazing-pattern').val(),
                glazingPatternName: this.currentGlazingPatternName || '',
                hardwareColour: $('#hardware-colour').val(),
                hardwareColourName: $('#hardware-colour-name').text(),
                location: '', // Can be set later
                attachedFiles: this.uploadedFiles.length > 0 ? [...this.uploadedFiles] : [] // Copy uploaded files
            };

            // Only include glazing type if it's not hidden for this style
            if (!this.glazingTypeHidden) {
                item.glazingType = $('#glazing-type').val();
                // Use the clean type label (without the appended " - pattern" suffix
                // that is shown in the display text) so the backend stores it correctly.
                item.glazingTypeName = this.currentGlazingTypeName || $('#glazing-type-name').text();
            }

            // Only include glazing features if it's not hidden for this style
            if (!this.glazingFeaturesHidden) {
                item.glazingFeatures = $('#glazing-features').val();
                item.glazingFeaturesName = $('#glazing-features-name').text();
            }

            // Include opening if selected (for products that have opening options)
            if (this.currentItem.opening) {
                item.opening = this.currentItem.opening;
                item.openingName = this.currentItem.openingName;
            }

            // Include segment widths for bay windows with sided styles
            var segmentCount = this.getSegmentCount();
            if (segmentCount > 0) {
                item.segmentWidths = this.collectSegmentWidths();
            }

            if (this.editingItemId) {
                // Update existing item
                const index = this.basket.findIndex(i => i.id === this.editingItemId);
                if (index !== -1) {
                    this.basket[index] = item;
                }
                this.editingItemId = null;
            } else {
                // Add new item
                this.basket.push(item);
            }

            // Reset current item
            this.currentItem = {};
            this.resetConfigurationForm();
            this.saveState(); // Save state after adding/updating item
        },

        resetConfigurationForm: function() {
            $('#width').val('');
            $('#height').val('');
            $('#cill').val('');
            $('#inside-colour').val('');
            $('#outside-colour').val('');
            $('#inside-finish-type').val('');
            $('#outside-finish-type').val('');
            $('#inside-colour-name').text('None');
            $('#outside-colour-name').text('None');
            $('#glazing-type').val('');
            $('#glazing-type-name').text('None');
            $('#glazing-pattern').val('');
            $('#glazing-pattern-group').hide();
            $('#glazing-features').val('not-required');
            $('#glazing-features-name').text('Not Required');
            $('#infill-panel').val('');
            $('.infill-panel-selection').hide();
            $('#hardware-colour').val('');
            $('#hardware-colour-name').text('None');
            // Clear file upload state (data → UI → input for consistency)
            this.uploadedFiles = [];
            $('#file-preview').empty();
            $('#frame-images').val('');
            // Reset segment widths
            $('#segment-widths-inputs').empty();
            $('#segment-widths-group').hide();
            $('.colour-item').removeClass('selected');
            $('.glazing-type-card').removeClass('selected');
            $('.glazing-pattern-card').removeClass('selected');
            $('.glazing-feature-item').removeClass('selected');

            // Re-auto-select first glazing type to maintain consistent UX and prevent layout shifts
            this.autoSelectFirstGlazingType();
        },

        showBasketReview: function() {
            this.renderBasket();
            this.navigateToStep('basket');
        },

        renderBasket: function() {
            const $container = $('#basket-items-container');
            $container.empty();

            $('#basket-item-count').text(this.basket.length);
            $('.basket-counter').text(this.basket.length);

            if (this.basket.length === 0) {
                $container.append('<p class="empty-basket">Your basket is empty. Click <strong>Add Item</strong> button to continue.</p>');
                return;
            }

            this.basket.forEach((item, index) => {
                const $item = this.createBasketItemElement(item, index);
                $container.append($item);
            });
        },

        createBasketItemElement: function(item, index) {
            const self = this;

            const $itemDiv = $('<div class="basket-item" data-item-id="' + item.id + '"></div>');

            const $thumbnail = $('<div class="item-thumbnail"></div>');
            $thumbnail.append('<img src="' + item.styleImage + '" alt="' + item.styleName + '" loading="lazy">');
            $thumbnail.append('<p class="style-name">' + item.styleName + '</p>');

            const $details = $('<div class="item-details"></div>');
            $details.append('<h3>Item ' + (index + 1) + '</h3>');

            // Location - always editable
            const $locationContainer = $('<p class="item-location"></p>');
            const locationText = item.location ? item.location : 'set location';
            const locationClass = item.location ? 'edit-location-link' : 'set-location-link';
            const $locationLink = $('<a href="#" class="' + locationClass + '">' + (item.location ? '<strong>Location:</strong> ' + locationText : locationText) + '</a>');

            $locationLink.on('click', function(e) {
                e.preventDefault();
                const currentLocation = item.location || '';
                const location = prompt('Enter location for this item:', currentLocation);
                if (location !== null && location !== currentLocation) {
                    item.location = location;
                    self.renderBasket();
                    self.saveState(); // Save state after updating location
                }
            });

            $locationContainer.append($locationLink);
            $details.append($locationContainer);

            const $table = $('<table class="item-summary"></table>');

            // Use display names for Glazing Features and Hardware Colour
            const glazingFeaturesDisplay = item.glazingFeaturesName || item.glazingFeatures;
            const hardwareColourDisplay = item.hardwareColourName || item.hardwareColour;

            // Use display names with finish types if available, otherwise fall back to colour values
            const insideColourDisplay = item.insideColourName || item.insideColour;
            const outsideColourDisplay = item.outsideColourName || item.outsideColour;

            const fields = [
                { label: 'Product', value: (item.materialName || '') + ' ' + item.typeName, field: 'product' },
                { label: 'Size', value: item.width + 'w x ' + item.height + 'h mm', field: 'size' }
            ];

            // Show Segment Widths if present (Bay Windows with sided styles)
            if (item.segmentWidths && item.segmentWidths.length > 0) {
                var segmentDisplay = item.segmentWidths.map(function(w, i) {
                    return 'S' + (i + 1) + ': ' + w + 'mm';
                }).join(', ');
                fields.push({ label: 'Segment Widths', value: segmentDisplay, field: 'size' });
            }

            if ((item.type || '').toLowerCase() === 'composite-doors') {
                fields.push({ label: 'Door Colour', value: outsideColourDisplay, field: 'colour' });
                fields.push({ label: 'Frame Colour', value: insideColourDisplay, field: 'colour' });
                fields.push({ label: 'Inside Colour', value: 'White', field: 'colour' });
            } else {
                fields.push({ label: 'Colours', value: outsideColourDisplay + ' / ' + insideColourDisplay, field: 'colour' });
            }

            // Only show Glazing Type if it exists (some styles hide this field)
            if (item.glazingType || item.glazingTypeName) {
                // glazingTypeName is stored clean (without the pattern); append the
                // pattern name for display so the basket shows e.g. "Low E (Triple) - Clear".
                const glazingTypeLabel = item.glazingTypeName || item.glazingType;
                const glazingPatternLabel = item.glazingPatternName || item.glazingPattern;
                const glazingValue = glazingPatternLabel
                    ? glazingTypeLabel + ' - ' + glazingPatternLabel
                    : glazingTypeLabel;
                fields.push({ label: 'Glazing Type', value: glazingValue, field: 'glazing' });
            }

            // Only show Glazing Features if it exists (some styles hide this field)
            if (item.glazingFeatures || item.glazingFeaturesName) {
                fields.push({ label: 'Glazing Feature', value: glazingFeaturesDisplay, field: 'glazingFeatures' });
            }

            // Only show Infill Panel if it exists (only for Glazed Doors and French Doors with midrail styles)
            if (item.infillPanel) {
                fields.push({ label: 'Infill Panel', value: item.infillPanel, field: 'infillPanel' });
            }

            fields.push({ label: 'Hardware Colour', value: hardwareColourDisplay, field: 'hardware' });

            // Only show Opening if it exists (only for products that have opening options)
            if (item.opening || item.openingName) {
                fields.push({ label: 'Opening', value: item.openingName || item.opening, field: 'opening' });
            }

            // Only show Side Panels if it exists (only for Composite Doors)
            if (item.sidePanels) {
                fields.push({ label: 'Side Panels', value: item.sidePanels, field: 'sidePanels' });
            }

            fields.forEach(field => {
                const $row = $('<tr></tr>');
                $row.append('<td><strong>' + field.label + ':</strong></td>');

                // Product field is not editable, so don't add click handler
                if (field.field === 'product') {
                    const $valueCell = $('<td>' + field.value + '</td>');
                    $row.append($valueCell);
                } else {
                    const $valueCell = $('<td class="editable-field" data-field="' + field.field + '">' + field.value + '</td>');
                    $valueCell.on('click', function() {
                        self.editItemField(item.id, field.field);
                    });
                    $row.append($valueCell);
                }

                $table.append($row);
            });

            $details.append($table);

            // Add helper text
            const $helperText = $('<p class="basket-edit-hint">Click on any option above to make changes</p>');
            $details.append($helperText);

            // Display attached file if any
            if (item.attachedFiles && item.attachedFiles.length > 0) {
                const $filesSection = $('<div class="item-attached-files"></div>');
                $filesSection.append('<p><strong>Attached Image:</strong></p>');
                const $filesList = $('<ul class="attached-files-list"></ul>');
                item.attachedFiles.forEach(file => {
                    $filesList.append('<li>' + file.name + ' (' + Math.round(file.size / 1024) + 'KB)</li>');
                });
                $filesSection.append($filesList);
                $details.append($filesSection);
            }

            const $actions = $('<div class="item-actions"></div>');

            const $copyBtn = $('<button type="button" class="btn btn-sm btn-secondary">Copy</button>');
            $copyBtn.on('click', function() {
                self.copyBasketItem(item.id);
            });

            const $deleteBtn = $('<button type="button" class="btn btn-sm btn-danger">Delete</button>');
            $deleteBtn.on('click', function() {
                if (confirm('Are you sure you want to delete this item?')) {
                    self.deleteBasketItem(item.id);
                }
            });

            $actions.append($copyBtn).append($deleteBtn);

            $itemDiv.append($thumbnail).append($details).append($actions);

            return $itemDiv;
        },

        editItemField: function(itemId, field) {
            const item = this.basket.find(i => i.id === itemId);
            if (!item) return;

            const self = this;
            const $modal = $('#edit-item-modal');
            const $content = $('#edit-item-content');

            $content.empty();

            if (field === 'size') {
                $content.append('<div class="edit-field-group"><label>Width (mm):</label><input type="number" id="edit-width" value="' + item.width + '" min="200" max="4000"></div>');
                $content.append('<div class="edit-field-group"><label>Height (mm):</label><input type="number" id="edit-height" value="' + item.height + '" min="200" max="3200"></div>');

                // Build cill options dynamically from settings
                let cillOptionsHtml = '<div class="edit-field-group"><label>External Sub Cill:</label><select id="edit-cill">';
                this.cillOptions.forEach(function(option) {
                    const selected = item.cill === option.value ? ' selected' : '';
                    cillOptionsHtml += '<option value="' + option.value + '"' + selected + '>' + option.label + '</option>';
                });
                cillOptionsHtml += '</select></div>';
                $content.append(cillOptionsHtml);

                // Add segment width fields for bay windows with sided styles
                var editSegmentCount = this.getSegmentCountFromItem(item);
                if (editSegmentCount > 0) {
                    var editSegmentWidths = item.segmentWidths || [];
                    $content.append('<div class="edit-field-group"><label><strong>Segment Widths (mm):</strong></label></div>');
                    for (var si = 1; si <= editSegmentCount; si++) {
                        var sVal = editSegmentWidths[si - 1] || '';
                        $content.append('<div class="edit-field-group"><label>Segment ' + si + ' Width (mm):</label><input type="number" class="edit-segment-width" data-segment="' + si + '" value="' + sVal + '" min="1"></div>');
                    }
                }
            } else if (field === 'colour') {
                // Store modal selected colors
                this.modalSelectedColors = {
                    inside: item.insideColour,
                    outside: item.outsideColour
                };

                // Store finish types for correct selection
                this.modalFinishTypes = {
                    inside: item.insideFinishType || '',
                    outside: item.outsideFinishType || ''
                };

                // Store item material and type for filtering
                this.modalItemMaterial = item.material || '';
                this.modalItemType = item.type || '';

                // Check if material is aluminium
                const isAluminium = this.modalItemMaterial.toLowerCase().includes('aluminium') ||
                                   this.modalItemMaterial.toLowerCase().includes('aluminum');

                // Add aluminium type selection if aluminium material
                if (isAluminium) {
                    // Get or default aluminium type
                    this.modalAluminiumType = item.aluminiumColourType || 'stock';

                    $content.append('<div class="edit-field-group">' +
                        '<label>Select Colour Type</label>' +
                        '<div class="aluminium-type-grid">' +
                            '<div class="aluminium-type-card' + (this.modalAluminiumType === 'stock' ? ' selected' : '') + '" data-aluminium-type="stock">' +
                                '<h4>Aluminium Stock Colours</h4>' +
                                '<p>Choose from 4 standard colours</p>' +
                            '</div>' +
                            '<div class="aluminium-type-card' + (this.modalAluminiumType === 'special' ? ' selected' : '') + '" data-aluminium-type="special">' +
                                '<h4>Aluminium Special Colours</h4>' +
                                '<p>Choose custom external and internal colours</p>' +
                            '</div>' +
                        '</div>' +
                        '</div>');
                }

                // Create outside colour picker (hide for aluminium stock)
                const isCompositeModal = (item.type || '').toLowerCase() === 'composite-doors';
                const outsideLabel = isCompositeModal ? 'Door Colour' : 'Outside Colour';
                const outsideDisplay = isAluminium && this.modalAluminiumType === 'stock' ? 'style="display:none;"' : '';

                $content.append('<div class="edit-field-group modal-colour-picker" id="modal-outside-colour-picker" ' + outsideDisplay + '>' +
                    '<label id="modal-outside-colour-label">' + outsideLabel + ':</label>' +
                    '<div class="colour-selection-display">Selected: <strong id="modal-outside-colour-name">' + (item.outsideColourName || item.outsideColour) + '</strong></div>' +
                    '<input type="text" id="modal-outside-colour-search" class="modal-colour-search" placeholder="Search colours...">' +
                    '<div id="modal-outside-colour-grid" class="colour-grid modal-colour-grid"></div>' +
                    '</div>');

                // Create inside colour picker
                const insideLabel = isCompositeModal ? 'Frame Colour' : (isAluminium && this.modalAluminiumType === 'stock' ? 'Select Colour' : 'Inside Colour');

                $content.append('<div class="edit-field-group modal-colour-picker">' +
                    '<label id="modal-inside-colour-label">' + insideLabel + ':</label>' +
                    '<div class="colour-selection-display">Selected: <strong id="modal-inside-colour-name">' + (item.insideColourName || item.insideColour) + '</strong></div>' +
                    '<input type="text" id="modal-inside-colour-search" class="modal-colour-search" placeholder="Search colours...">' +
                    '<div id="modal-inside-colour-grid" class="colour-grid modal-colour-grid"></div>' +
                    '</div>');

                if (isCompositeModal) {
                    $content.append('<div class="edit-field-group"><label>Inside Colour:</label> <strong>White</strong></div>');
                }

                // Handle aluminium type selection
                if (isAluminium) {
                    $('.aluminium-type-card').on('click', function() {
                        const alType = $(this).data('aluminium-type');
                        self.modalAluminiumType = alType;

                        $('.aluminium-type-card').removeClass('selected');
                        $(this).addClass('selected');

                        // Reset selections
                        self.modalSelectedColors = { inside: '', outside: '' };
                        $('#modal-inside-colour-name').text('None');
                        $('#modal-outside-colour-name').text('None');

                        // Update labels and visibility
                        if (alType === 'stock') {
                            $('#modal-inside-colour-label').text('Select Colour');
                            $('#modal-outside-colour-picker').hide();
                        } else {
                            $('#modal-inside-colour-label').text('Inside Colour');
                            $('#modal-outside-colour-label').text('Outside Colour');
                            $('#modal-outside-colour-picker').show();
                        }

                        // Re-render grids
                        self.renderModalColourGrid('modal-inside-colour-grid', '', self.modalItemMaterial, alType);
                        self.renderModalColourGrid('modal-outside-colour-grid', '', self.modalItemMaterial, alType);
                    });
                }

                // Render colour grids after a brief delay to ensure DOM is ready
                setTimeout(function() {
                    self.renderModalColourGrid('modal-inside-colour-grid', item.insideColour, self.modalItemMaterial, self.modalAluminiumType, self.modalFinishTypes.inside);
                    self.renderModalColourGrid('modal-outside-colour-grid', item.outsideColour, self.modalItemMaterial, self.modalAluminiumType, self.modalFinishTypes.outside);
                }, 10);

                // Add search functionality
                $('#modal-outside-colour-search').on('input', function() {
                    self.filterColours('modal-outside-colour-grid', $(this).val().toLowerCase());
                });

                $('#modal-inside-colour-search').on('input', function() {
                    self.filterColours('modal-inside-colour-grid', $(this).val().toLowerCase());
                });
            } else if (field === 'glazing') {
                // Store modal selected glazing type and pattern
                this.modalSelectedGlazingType = item.glazingType;
                this.modalSelectedGlazingPattern = item.glazingPattern || '';
                this.modalSelectedGlazingPatternName = item.glazingPatternName || '';

                // Create glazing type picker (display text will be set by renderModalGlazingTypeGrid)
                $content.append('<div class="edit-field-group modal-glazing-type-picker">' +
                    '<label>Glazing Type:</label>' +
                    '<div class="glazing-type-selection-display">Selected: <strong id="modal-glazing-type-name"></strong></div>' +
                    '<div id="modal-glazing-type-grid" class="glazing-type-grid modal-glazing-type-grid"></div>' +
                    '</div>');

                // Add pattern section (initially hidden if no patterns)
                $content.append('<div class="edit-field-group modal-glazing-pattern-picker" id="modal-glazing-pattern-group" style="display: none;">' +
                    '<label>Glazing Pattern:</label>' +
                    '<div id="modal-glazing-pattern-grid" class="glazing-pattern-grid modal-glazing-pattern-grid"></div>' +
                    '</div>');

                // Render glazing type grid after a brief delay to ensure DOM is ready
                setTimeout(function() {
                    self.renderModalGlazingTypeGrid('modal-glazing-type-grid', item.glazingType, item.glazingPattern);
                }, 10);
            } else if (field === 'glazingFeatures') {
                // Store modal selected glazing feature
                this.modalSelectedGlazingFeature = item.glazingFeatures || 'not-required';

                // Get the feature name for display
                let featureName = 'Not Required';
                if (item.glazingFeatures && item.glazingFeatures !== 'not-required') {
                    const feature = this.glazingFeatures.find(f => f.value === item.glazingFeatures);
                    if (feature) {
                        featureName = feature.name;
                    }
                }

                // Create glazing features picker
                $content.append('<div class="edit-field-group modal-glazing-features-picker">' +
                    '<label>Glazing Features:</label>' +
                    '<div class="glazing-features-selection-display">Selected: <strong id="modal-glazing-features-name">' + featureName + '</strong></div>' +
                    '<input type="text" id="modal-glazing-features-search" class="modal-glazing-features-search" placeholder="Search glazing features...">' +
                    '<div id="modal-glazing-features-grid" class="glazing-features-grid modal-glazing-features-grid"></div>' +
                    '</div>');

                // Render glazing features grid after a brief delay to ensure DOM is ready
                setTimeout(function() {
                    self.renderModalGlazingFeaturesGrid('modal-glazing-features-grid', item.glazingFeatures || 'not-required');
                }, 10);

                // Add search functionality
                $('#modal-glazing-features-search').on('input', function() {
                    self.filterGlazingFeatures('modal-glazing-features-grid', $(this).val().toLowerCase());
                });
            } else if (field === 'hardware') {
                // Store modal selected hardware colour
                this.modalSelectedHardwareColour = item.hardwareColour;

                // Get the colour name for display
                let colourName = item.hardwareColour;
                const colour = this.hardwareColours.find(c => (c.value || c.label) === item.hardwareColour);
                if (colour) {
                    colourName = colour.label || colour.name;
                }

                // Create hardware colour picker
                $content.append('<div class="edit-field-group modal-hardware-colour-picker">' +
                    '<label>Hardware Colour:</label>' +
                    '<div class="colour-selection-display">Selected: <strong id="modal-hardware-colour-name">' + colourName + '</strong></div>' +
                    '<div id="modal-hardware-colour-grid" class="hardware-colour-grid modal-hardware-colour-grid"></div>' +
                    '</div>');

                // Render hardware colour grid after a brief delay to ensure DOM is ready
                setTimeout(function() {
                    self.renderModalHardwareColourGrid('modal-hardware-colour-grid', item.hardwareColour);
                }, 10);
            } else if (field === 'opening') {
                // Store modal selected opening
                this.modalSelectedOpening = item.opening;
                this.modalSelectedOpeningName = item.openingName;

                // Create opening picker
                $content.append('<div class="edit-field-group modal-opening-picker">' +
                    '<label>Opening:</label>' +
                    '<div class="opening-selection-display">Selected: <strong id="modal-opening-name">' + (item.openingName || 'None') + '</strong></div>' +
                    '<div id="modal-opening-grid" class="opening-grid modal-opening-grid"></div>' +
                    '</div>');

                // Render opening grid after a brief delay to ensure DOM is ready
                setTimeout(function() {
                    self.renderModalOpeningGrid('modal-opening-grid', item);
                }, 10);
            } else if (field === 'infillPanel') {
                // Store modal selected infill panel
                this.modalSelectedInfillPanel = item.infillPanel;

                // Create infill panel picker with select dropdown
                $content.append('<div class="edit-field-group modal-infill-panel-picker">' +
                    '<label>Infill Panel:</label>' +
                    '<select id="modal-infill-panel">' +
                    '<option value="Not Required"' + (item.infillPanel === 'Not Required' ? ' selected' : '') + '>Not Required</option>' +
                    '<option value="Yes"' + (item.infillPanel === 'Yes' ? ' selected' : '') + '>Yes</option>' +
                    '</select>' +
                    '</div>');

                // Update selected value when changed
                $('#modal-infill-panel').on('change', function() {
                    self.modalSelectedInfillPanel = $(this).val();
                });
            }

            $modal.show();

            // Unbind previous click handler and bind new one
            $('.modal-apply').off('click').on('click', function() {
                if (field === 'size') {
                    item.width = $('#edit-width').val();
                    item.height = $('#edit-height').val();
                    item.cill = $('#edit-cill').val();
                    item.cillName = $('#edit-cill option:selected').text();
                    // Save segment widths if present
                    var $editSegWidths = $('.edit-segment-width');
                    if ($editSegWidths.length > 0) {
                        item.segmentWidths = [];
                        $editSegWidths.each(function() {
                            item.segmentWidths.push($(this).val());
                        });
                    }
                } else if (field === 'colour') {
                    item.insideColour = self.modalSelectedColors.inside;
                    item.outsideColour = self.modalSelectedColors.outside;
                    item.insideColourName = $('#modal-inside-colour-name').text();
                    item.outsideColourName = $('#modal-outside-colour-name').text();
                    item.insideFinishType = self.modalFinishTypes.inside;
                    item.outsideFinishType = self.modalFinishTypes.outside;
                } else if (field === 'glazing') {
                    item.glazingType = self.modalSelectedGlazingType;
                    // Use the clean type label (without the appended " - pattern" suffix).
                    item.glazingTypeName = self.modalSelectedGlazingTypeName || $('#modal-glazing-type-name').text();
                    item.glazingPattern = self.modalSelectedGlazingPattern;
                    item.glazingPatternName = self.modalSelectedGlazingPatternName || '';
                } else if (field === 'glazingFeatures') {
                    item.glazingFeatures = self.modalSelectedGlazingFeature;
                    item.glazingFeaturesName = $('#modal-glazing-features-name').text();
                } else if (field === 'hardware') {
                    item.hardwareColour = self.modalSelectedHardwareColour;
                    item.hardwareColourName = $('#modal-hardware-colour-name').text();
                } else if (field === 'opening') {
                    item.opening = self.modalSelectedOpening;
                    item.openingName = self.modalSelectedOpeningName;
                } else if (field === 'infillPanel') {
                    item.infillPanel = self.modalSelectedInfillPanel;
                }

                $modal.hide();
                self.renderBasket();
                self.saveState(); // Save state after editing
            });
        },

        renderModalColourGrid: function(gridId, selectedColour, material, aluminiumType, selectedFinishType) {
            const self = this;
            const $grid = $('#' + gridId);
            const isInside = gridId.includes('inside');

            $grid.empty();

            // Filter colours by material and type (use modal item type for proper filtering)
            let filteredColours = material ? this.filterColoursByMaterialAndType(material, this.modalItemType) : this.colours;

            // Composite Doors: outside grid = Door colours, inside grid = Frame colours.
            // All other products: exclude Door/Frame colours (composite-only) from the picker.
            const isCompositeModalGrid = (this.modalItemType || '').toLowerCase() === 'composite-doors';
            if (isCompositeModalGrid) {
                const wantApplies = isInside ? 'Frame' : 'Door';
                filteredColours = filteredColours.filter(c => (c.applies_to || '') === wantApplies);
            } else {
                filteredColours = filteredColours.filter(c => !c.applies_to);
            }

            // Check if aluminium material
            const isAluminium = material && (material.toLowerCase().includes('aluminium') || material.toLowerCase().includes('aluminum'));

            // For aluminium, filter by colour type (stock/special)
            if (isAluminium && aluminiumType) {
                if (aluminiumType === 'stock') {
                    filteredColours = filteredColours.filter(c => c.category === 'Aluminium Stock Colours');
                } else if (aluminiumType === 'special') {
                    filteredColours = filteredColours.filter(c => c.category === 'Aluminium Special Colours');
                }
            } else if (isAluminium) {
                // Default to stock if no type specified
                filteredColours = filteredColours.filter(c => c.category === 'Aluminium Stock Colours');
            } else {
                // For non-aluminium, exclude aluminium colours
                filteredColours = filteredColours.filter(c =>
                    c.category !== 'Aluminium Stock Colours' &&
                    c.category !== 'Aluminium Special Colours'
                );
            }

            // For aluminium special colours, group by finish type
            if (isAluminium && aluminiumType === 'special') {
                const finishTypes = {
                    'Matt': [],
                    'Gloss': [],
                    'Metallic': [],
                    'Satin': []
                };

                filteredColours.forEach(colour => {
                    let finishTypesArray = [];

                    if (Array.isArray(colour.finish_type)) {
                        finishTypesArray = colour.finish_type.length > 0 ? colour.finish_type : ['Matt'];
                    } else if (colour.finish_type) {
                        finishTypesArray = [colour.finish_type];
                    } else {
                        finishTypesArray = ['Matt'];
                    }

                    finishTypesArray.forEach(ft => {
                        if (finishTypes[ft]) {
                            finishTypes[ft].push(colour);
                        }
                    });
                });

                // Render by finish type
                Object.keys(finishTypes).forEach(finishType => {
                    if (finishTypes[finishType].length === 0) return;

                    const $finishGroup = $('<div class="colour-category"></div>');
                    $finishGroup.append('<h5>' + finishType.toUpperCase() + '</h5>');

                    const $colourItems = $('<div class="colour-items"></div>');
                    finishTypes[finishType].forEach(colour => {
                        this.renderModalColourItem($colourItems, colour, selectedColour, gridId, isInside, finishType, selectedFinishType);
                    });

                    $finishGroup.append($colourItems);
                    $grid.append($finishGroup);
                });
            } else {
                // Group by category for regular colours
                const categories = {};
                filteredColours.forEach(colour => {
                    if (!categories[colour.category]) {
                        categories[colour.category] = [];
                    }
                    categories[colour.category].push(colour);
                });

                // Render colours by category
                Object.keys(categories).forEach(category => {
                    const $categoryGroup = $('<div class="colour-category"></div>');
                    $categoryGroup.append('<h5>' + category + '</h5>');

                    const $colourItems = $('<div class="colour-items"></div>');
                    categories[category].forEach(colour => {
                        this.renderModalColourItem($colourItems, colour, selectedColour, gridId, isInside);
                    });

                    $categoryGroup.append($colourItems);
                    $grid.append($categoryGroup);
                });
            }
        },

        renderModalColourItem: function($container, colour, selectedColour, gridId, isInside, finishType, selectedFinishType) {
            const self = this;
            const $colourSwatch = $('<div class="colour-swatch" data-colour="' + colour.name + '" data-category="' + colour.category + '" data-hex="' + colour.hex + '"></div>');

            // Add finish type if provided (for aluminium special colours)
            if (finishType) {
                $colourSwatch.attr('data-finish-type', finishType);
            }

            // Check if colour has an image
            if (colour.colour_image && colour.colour_image.url) {
                // Use image instead of hex color
                const $img = $('<img src="' + colour.colour_image.url + '" alt="' + colour.name + '" />');
                $colourSwatch.addClass('has-image').append($img);
            } else {
                // Fall back to hex color
                $colourSwatch.css('background-color', colour.hex);
            }

            $colourSwatch.attr('title', colour.name);

            const $colourLabel = $('<span class="colour-label">' + colour.name + '</span>');

            const $colourItem = $('<div class="colour-item"></div>');
            $colourItem.append($colourSwatch).append($colourLabel);

            // Mark selected colour - for aluminium special, also match finish type
            if (colour.name === selectedColour) {
                if (finishType && selectedFinishType) {
                    // For aluminium special colours, match both name and finish type
                    if (finishType === selectedFinishType) {
                        $colourItem.addClass('selected');
                    }
                } else {
                    // For regular colours, just match name
                    $colourItem.addClass('selected');
                }
            }

            $colourItem.on('click', function() {
                const colourName = String($(this).find('.colour-swatch').data('colour'));
                const colourCategory = $(this).find('.colour-swatch').data('category');
                const clickedFinishType = $(this).find('.colour-swatch').data('finish-type');
                self.selectModalColour(gridId, colourName, isInside, colourCategory, clickedFinishType);
            });

            $container.append($colourItem);
        },

        selectModalColour: function(gridId, colourName, isInside, colourCategory, clickedFinishType) {
            const prefix = isInside ? 'inside' : 'outside';

            // Update the modalSelectedColors object
            if (isInside) {
                this.modalSelectedColors.inside = colourName;
                this.modalFinishTypes.inside = clickedFinishType || '';

                // For Aluminium Stock Colours, also set outside colour to match inside
                if (this.modalAluminiumType === 'stock') {
                    this.modalSelectedColors.outside = colourName;
                    this.modalFinishTypes.outside = clickedFinishType || '';
                    $('#modal-outside-colour-name').text(colourName);
                }
            } else {
                this.modalSelectedColors.outside = colourName;
                this.modalFinishTypes.outside = clickedFinishType || '';
            }

            // Find the colour object - for Aluminium Special Colours, also match finish type
            let colour;
            if (colourCategory === 'Aluminium Special Colours' && clickedFinishType) {
                // Match by name, category AND finish type to get the correct variant
                colour = this.colours.find(c => {
                    const ft = c.finish_type;
                    const matchesFinish = Array.isArray(ft) ? ft.includes(clickedFinishType) : ft === clickedFinishType;
                    return c.name === colourName &&
                           c.category === colourCategory &&
                           matchesFinish;
                });
            } else if (colourCategory) {
                // Match by name and category
                colour = this.colours.find(c => c.name === colourName && c.category === colourCategory);
            } else {
                // Match by name only
                colour = this.colours.find(c => c.name === colourName);
            }
            let displayText = colourName;

            // For aluminium special colours, prepend finish type (now single value from backend)
            if (colour && colour.category === 'Aluminium Special Colours' && colour.finish_type) {
                displayText = colour.finish_type + ' ' + colourName;
            }

            // Update display
            $('#modal-' + prefix + '-colour-name').text(displayText);

            // Update visual selection
            $('#' + gridId + ' .colour-item').removeClass('selected');
            if (colourCategory === 'Aluminium Special Colours' && clickedFinishType) {
                // For aluminium special colours, match by name, finish type AND category
                $('#' + gridId + ' .colour-item').filter(function() {
                    const $swatch = $(this).find('.colour-swatch');
                    return $swatch.data('colour') === colourName &&
                           $swatch.data('finish-type') === clickedFinishType &&
                           $swatch.data('category') === colourCategory;
                }).addClass('selected');
            } else {
                // For other colours, match by name only
                $('#' + gridId + ' .colour-item').filter(function() {
                    return $(this).find('.colour-swatch').data('colour') === colourName;
                }).addClass('selected');
            }
        },

        renderModalGlazingFeaturesGrid: function(gridId, selectedFeature) {
            const self = this;
            const $grid = $('#' + gridId);

            $grid.empty();

            // Add "Not Required" option first
            const $notRequiredCategory = $('<div class="glazing-feature-category"></div>');
            $notRequiredCategory.append('<h5>Not Required</h5>');

            const $notRequiredItems = $('<div class="glazing-feature-items"></div>');
            const $notRequiredItem = $('<div class="glazing-feature-item" data-feature="not-required"></div>');
            const $notRequiredSwatch = $('<div class="glazing-feature-swatch"></div>');
            $notRequiredSwatch.text('None');
            const $notRequiredLabel = $('<span class="glazing-feature-label">Not Required</span>');
            $notRequiredItem.append($notRequiredSwatch).append($notRequiredLabel);

            // Mark selected if it matches
            if (selectedFeature === 'not-required') {
                $notRequiredItem.addClass('selected');
            }

            $notRequiredItem.on('click', function() {
                self.selectModalGlazingFeature('modal-glazing-features-grid', 'not-required', 'Not Required');
            });

            $notRequiredItems.append($notRequiredItem);
            $notRequiredCategory.append($notRequiredItems);
            $grid.append($notRequiredCategory);

            // Group by category
            const categories = {};
            this.glazingFeatures.forEach(feature => {
                if (!categories[feature.category]) {
                    categories[feature.category] = [];
                }
                categories[feature.category].push(feature);
            });

            // Render features by category
            Object.keys(categories).forEach(category => {
                const $categoryGroup = $('<div class="glazing-feature-category"></div>');
                $categoryGroup.append('<h5>' + category + '</h5>');

                const $featureItems = $('<div class="glazing-feature-items"></div>');
                categories[category].forEach(feature => {
                    const $featureSwatch = $('<div class="glazing-feature-swatch" data-feature="' + feature.value + '"></div>');

                    // Check if feature has an image
                    if (feature.feature_image && feature.feature_image.url) {
                        const $img = $('<img src="' + feature.feature_image.url + '" alt="' + feature.name + '" />');
                        $featureSwatch.addClass('has-image').append($img);
                    } else {
                        $featureSwatch.text(feature.name);
                    }

                    $featureSwatch.attr('title', feature.name);

                    const $featureLabel = $('<span class="glazing-feature-label">' + feature.name + '</span>');

                    const $featureItem = $('<div class="glazing-feature-item"></div>');
                    $featureItem.append($featureSwatch).append($featureLabel);

                    // Mark selected if it matches
                    if (feature.value === selectedFeature) {
                        $featureItem.addClass('selected');
                    }

                    $featureItem.on('click', function() {
                        self.selectModalGlazingFeature('modal-glazing-features-grid', feature.value, feature.name);
                    });

                    $featureItems.append($featureItem);
                });

                $categoryGroup.append($featureItems);
                $grid.append($categoryGroup);
            });
        },

        selectModalGlazingFeature: function(gridId, featureValue, featureName) {
            // Update the modalSelectedGlazingFeature value
            this.modalSelectedGlazingFeature = featureValue;

            // Update display
            $('#modal-glazing-features-name').text(featureName);

            // Update visual selection
            $('#' + gridId + ' .glazing-feature-item').removeClass('selected');
            $('#' + gridId + ' .glazing-feature-item').filter(function() {
                // Check both swatch data-feature and item data-feature (for "Not Required")
                return $(this).find('.glazing-feature-swatch').data('feature') === featureValue ||
                       $(this).data('feature') === featureValue;
            }).addClass('selected');
        },

        renderModalHardwareColourGrid: function(gridId, selectedColour) {
            const self = this;
            const $grid = $('#' + gridId);

            $grid.empty();

            // Render hardware colours (no categories, just a simple grid)
            const $colourItems = $('<div class="colour-items"></div>');

            this.hardwareColours.forEach(colour => {
                const colourName = colour.label || colour.name;
                const colourValue = colour.value || colour.label;
                const colourHex = colour.hex || '#CCCCCC';

                const $colourSwatch = $('<div class="colour-swatch" data-colour="' + colourValue + '" data-hex="' + colourHex + '"></div>');

                // Use hex color (no images for hardware colours)
                $colourSwatch.css('background-color', colourHex);
                $colourSwatch.attr('title', colourName);

                const $colourLabel = $('<span class="colour-label">' + colourName + '</span>');

                const $colourItem = $('<div class="colour-item"></div>');
                $colourItem.append($colourSwatch).append($colourLabel);

                // Mark selected colour
                if (colourValue === selectedColour) {
                    $colourItem.addClass('selected');
                }

                $colourItem.on('click', function() {
                    const value = $(this).find('.colour-swatch').data('colour');
                    self.selectModalHardwareColour(value, colourName);
                });

                $colourItems.append($colourItem);
            });

            $grid.append($colourItems);
        },

        selectModalHardwareColour: function(colourValue, colourName) {
            // Update the modalSelectedHardwareColour value
            this.modalSelectedHardwareColour = colourValue;

            // Update display
            $('#modal-hardware-colour-name').text(colourName);

            // Update visual selection
            $('#modal-hardware-colour-grid .colour-item').removeClass('selected');
            $('#modal-hardware-colour-grid .colour-item').filter(function() {
                return $(this).find('.colour-swatch').data('colour') === colourValue;
            }).addClass('selected');
        },

        renderModalOpeningGrid: function(gridId, item) {
            const self = this;
            const $grid = $('#' + gridId);

            $grid.empty();

            // Filter openings for the item's product type
            const currentTypeSlug = (item.type || '').toLowerCase();
            const availableOpenings = this.openings.filter(opening => {
                if (!opening.available_types || opening.available_types.length === 0) {
                    return false;
                }
                return opening.available_types.some(type => type.toLowerCase() === currentTypeSlug);
            });

            // Create opening cards
            availableOpenings.forEach(opening => {
                const imageUrl = opening.image && opening.image.url ? opening.image.url : '';
                const slug = opening.slug || '';
                const name = opening.name || '';

                const $card = $('<div class="image-card opening-card" data-opening="' + slug + '"></div>');
                if (imageUrl) {
                    $card.append('<img src="' + imageUrl + '" alt="' + name + '">');
                }
                $card.append('<h3 class="opening-card-title">' + name + '</h3>');

                // Mark selected
                if (slug === item.opening) {
                    $card.addClass('selected');
                }

                $card.on('click', function() {
                    self.selectModalOpening(slug, name);
                });

                $grid.append($card);
            });
        },

        selectModalOpening: function(openingValue, openingName) {
            // Update the modal selected opening values
            this.modalSelectedOpening = openingValue;
            this.modalSelectedOpeningName = openingName;

            // Update display
            $('#modal-opening-name').text(openingName);

            // Update visual selection
            $('#modal-opening-grid .opening-card').removeClass('selected');
            $('#modal-opening-grid .opening-card').filter(function() {
                return $(this).data('opening') === openingValue;
            }).addClass('selected');
        },

        renderModalGlazingTypeGrid: function(gridId, selectedType, selectedPattern) {
            const self = this;
            const $grid = $('#' + gridId);

            $grid.empty();

            // Get all glazing type cards from the main form
            const $mainCards = $('.glazing-type-card').clone();

            $mainCards.each(function() {
                const $card = $(this);
                const glazingType = $card.data('glazing-type');
                const patterns = $card.data('patterns');

                // Clear any stale selection cloned from the main form, then mark
                // only the type that matches this item.
                $card.removeClass('selected');
                if (glazingType === selectedType) {
                    $card.addClass('selected');
                }

                // Add click handler
                $card.on('click', function() {
                    const type = $(this).data('glazing-type');
                    const typeName = $(this).find('.glazing-type-label').text();
                    let patternsData = $(this).data('patterns');

                    // Normalize patterns - ensure it's an array, not a string
                    if (typeof patternsData === 'string') {
                        try { patternsData = JSON.parse(patternsData); } catch(e) { patternsData = []; }
                    }

                    self.selectModalGlazingType(type, typeName, patternsData, selectedPattern);
                });

                $grid.append($card);
            });

            // If there's a selected type with patterns, show the pattern grid
            if (selectedType) {
                const $selectedCard = $('#' + gridId + ' .glazing-type-card[data-glazing-type="' + selectedType + '"]');
                if ($selectedCard.length > 0) {
                    const typeName = $selectedCard.find('.glazing-type-label').text().trim();
                    self.modalSelectedGlazingTypeName = typeName;

                    // Set initial display to just the type name
                    $('#modal-glazing-type-name').text(typeName);

                    let patterns = $selectedCard.data('patterns');

                    // Normalize patterns - ensure it's an array, not a string
                    if (typeof patterns === 'string') {
                        try { patterns = JSON.parse(patterns); } catch(e) { patterns = []; }
                    }

                    if (patterns && patterns.length > 0) {
                        self.renderModalGlazingPatternGrid(patterns, selectedPattern);
                        $('#modal-glazing-pattern-group').show();

                        // Update display if there's a selected pattern
                        if (selectedPattern) {
                            const selectedPatternObj = patterns.find(p => p.value === selectedPattern);
                            if (selectedPatternObj && selectedPatternObj.name) {
                                // Extract just the pattern name, in case it contains the full glazing type name
                                let patternDisplayName = selectedPatternObj.name;
                                // If the pattern name starts with the type name, extract just the pattern part
                                if (patternDisplayName.startsWith(typeName)) {
                                    patternDisplayName = patternDisplayName.substring(typeName.length).replace(/^\s*-\s*/, '').trim();
                                }
                                // Remember the resolved pattern name so applying without
                                // changing the pattern keeps the correct display value.
                                self.modalSelectedGlazingPatternName = patternDisplayName;
                                $('#modal-glazing-type-name').text(typeName + ' - ' + patternDisplayName);
                            }
                        }
                    }
                }
            }
        },

        selectModalGlazingType: function(glazingType, glazingTypeName, patterns, selectedPattern) {
            // Update the modal selected values
            this.modalSelectedGlazingType = glazingType;
            this.modalSelectedGlazingTypeName = glazingTypeName;

            // Update display
            $('#modal-glazing-type-name').text(glazingTypeName);

            // Update visual selection
            $('#modal-glazing-type-grid .glazing-type-card').removeClass('selected');
            $('#modal-glazing-type-grid .glazing-type-card[data-glazing-type="' + glazingType + '"]').addClass('selected');

            // Show/hide patterns based on availability
            if (patterns && patterns.length > 0) {
                this.renderModalGlazingPatternGrid(patterns, selectedPattern);
                $('#modal-glazing-pattern-group').show();
                // Reset pattern selection when changing glazing type
                this.modalSelectedGlazingPattern = '';
            } else {
                $('#modal-glazing-pattern-group').hide();
                this.modalSelectedGlazingPattern = '';
            }
        },

        renderModalGlazingPatternGrid: function(patterns, selectedPattern) {
            const self = this;
            const $grid = $('#modal-glazing-pattern-grid');

            $grid.empty();

            patterns.forEach(pattern => {
                const patternName = pattern.name || '';
                const patternValue = pattern.value || '';
                const patternImage = pattern.image && pattern.image.url ? pattern.image.url : '';

                const $patternCard = $('<div class="glazing-pattern-card" data-pattern="' + patternValue + '"></div>');

                if (patternImage) {
                    const $patternImage = $('<div class="glazing-pattern-image"></div>');
                    $patternImage.css('background-image', 'url(' + patternImage + ')');
                    $patternCard.append($patternImage);
                }

                const $patternLabel = $('<div class="glazing-pattern-label">' + patternName + '</div>');
                $patternCard.append($patternLabel);

                // Mark selected pattern
                if (patternValue === selectedPattern) {
                    $patternCard.addClass('selected');
                }

                $patternCard.on('click', function() {
                    const value = $(this).data('pattern');
                    self.selectModalGlazingPattern(value, patternName);
                });

                $grid.append($patternCard);
            });
        },

        selectModalGlazingPattern: function(patternValue, patternName) {
            // Update the modal selected pattern
            this.modalSelectedGlazingPattern = patternValue;
            this.modalSelectedGlazingPatternName = patternName || '';

            // Update display to include pattern name
            if (this.modalSelectedGlazingTypeName && patternName) {
                $('#modal-glazing-type-name').text(this.modalSelectedGlazingTypeName + ' - ' + patternName);
            }

            // Update visual selection
            $('#modal-glazing-pattern-grid .glazing-pattern-card').removeClass('selected');
            $('#modal-glazing-pattern-grid .glazing-pattern-card[data-pattern="' + patternValue + '"]').addClass('selected');
        },

        copyBasketItem: function(itemId) {
            const item = this.basket.find(i => i.id === itemId);
            if (!item) return;

            const newItem = Object.assign({}, item);
            newItem.id = 'item-' + Date.now();
            newItem.timestamp = Date.now();

            this.basket.push(newItem);
            this.renderBasket();
            this.saveState(); // Save state after copying item
        },

        deleteBasketItem: function(itemId) {
            this.basket = this.basket.filter(i => i.id !== itemId);
            this.renderBasket();
            this.saveState(); // Save state after deleting item
        },

        updateFinalSummary: function() {
            const $summary = $('#final-basket-summary');
            $summary.empty();

            this.basket.forEach((item, index) => {
                const $itemSummary = $('<div class="summary-item"></div>');
                $itemSummary.append('<h4>Item ' + (index + 1) + '</h4>');
                $itemSummary.append('<p><strong>Product:</strong> ' + item.typeName + ' ' + (item.materialName || '') + '</p>');
                $itemSummary.append('<p><strong>Size:</strong> ' + item.width + 'w x ' + item.height + 'h mm</p>');
                $itemSummary.append('<p><strong>Style:</strong> ' + item.styleName + '</p>');

                // Use display names with finish types if available, otherwise fall back to colour values
                const insideColourDisplay = item.insideColourName || item.insideColour;
                const outsideColourDisplay = item.outsideColourName || item.outsideColour;
                $itemSummary.append('<p><strong>Colours:</strong> ' + outsideColourDisplay + ' / ' + insideColourDisplay + '</p>');

                if (item.location) {
                    $itemSummary.append('<p><strong>Location:</strong> ' + item.location + '</p>');
                }
                $summary.append($itemSummary);
            });
        },

        submitForm: function() {
            const self = this;

            // Get form element
            const form = $('#quotation-form')[0];

            // Validate postcode first (custom validation)
            const postcodeInput = $('#customer-postcode')[0];
            const postcodeValue = $('#customer-postcode').val();
            const postcodeErrorMsg = this.postcodeValidation.validate(postcodeValue);

            if (postcodeErrorMsg) {
                postcodeInput.setCustomValidity(postcodeErrorMsg);
            } else {
                postcodeInput.setCustomValidity(''); // Clear custom error if valid
            }

            // Use native HTML5 form validation (checks all required fields)
            if (!form.checkValidity()) {
                form.reportValidity(); // Shows browser's native validation messages
                return;
            }

            // Require at least one availability slot to be selected
            if ($('input[name="availability[]"]:checked').length === 0) {
                const availabilityBox = $('input[name="availability[]"]')[0];
                if (availabilityBox) {
                    availabilityBox.setCustomValidity('Please select at least one time when someone is usually at home.');
                    form.reportValidity();
                    availabilityBox.setCustomValidity('');
                }
                return;
            }

            // Prepare data
            const customerData = {
                title: $('#customer-title').val(),
                name: $('#customer-name').val(),
                email: $('#customer-email').val(),
                alt_email: $('#customer-alt-email').val(),
                phone: $('#customer-phone').val(),
                alt_phone: $('#customer-alt-phone').val(),
                house_number: $('#customer-house-number').val(),
                street: $('#customer-street').val(),
                town: $('#customer-town').val(),
                county: $('#customer-county').val(),
                postcode: $('#customer-postcode').val(),
                directions: $('#customer-directions').val(),
                preferred_contact: $('#preferred-contact').val(),
                additional_notes: $('#additional-notes').val(),
                availability: $('input[name="availability[]"]:checked').map(function() {
                    return $(this).val();
                }).get(),
                utm_source: $('#utm_source').val(),
                utm_medium: $('#utm_medium').val(),
                utm_campaign: $('#utm_campaign').val(),
                utm_content: $('#utm_content').val(),
                fbclid: $('#fbclid').val(),
                landing_url: $('#landing_url').val(),
                referrer: $('#referrer').val()
            };

            // Show loading
            $('#submit-btn').prop('disabled', true).text('Submitting...');

            // Submit via AJAX
            $.ajax({
                url: (typeof quotationFormAjax !== 'undefined' && quotationFormAjax.ajaxurl) ? quotationFormAjax.ajaxurl : '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: {
                    action: 'submit_quotation_form',
                    nonce: (typeof quotationFormAjax !== 'undefined' && quotationFormAjax.nonce) ? quotationFormAjax.nonce : '',
                    basket_items: JSON.stringify(self.basket),
                    customer_data: customerData
                },
                success: function(response) {
                    if (response.success) {
                        alert('Thank you! Your quotation request has been submitted successfully. We will contact you soon.');
                        // Reset form and basket
                        self.basket = [];
                        self.renderBasket(); // Update basket display and counter
                        self.resetForm();
                        self.navigateToStep(1);
                        self.navigateToSubStep('1a');
                        self.clearState(); // Clear saved state after successful submission
                    } else {
                        alert('There was an error submitting your request. Please try again.');
                    }
                },
                error: function() {
                    alert('There was an error submitting your request. Please try again.');
                },
                complete: function() {
                    $('#submit-btn').prop('disabled', false).text('Submit Quote Request');
                }
            });
        },

        hasOpeningsForCurrentType: function() {
            if (!this.openings || this.openings.length === 0) {
                return false;
            }

            const currentTypeSlug = (this.currentItem.type || '').toLowerCase();
            if (!currentTypeSlug) {
                return false;
            }

            // Check if any opening is available for current type
            return this.openings.some(opening => {
                // If no types specified, don't show opening for any type
                if (!opening.available_types || opening.available_types.length === 0) {
                    return false;
                }

                return opening.available_types.some(type => {
                    return (type || '').toLowerCase() === currentTypeSlug;
                });
            });
        },

        showOpeningSelection: function() {
            const self = this;

            // Hide style grid and show opening selection
            $('.style-grid').hide();
            $('.form-step[data-step="2"] h2').text('Select Opening Direction');

            // Filter openings for current type
            const currentTypeSlug = (this.currentItem.type || '').toLowerCase();
            const availableOpenings = this.openings.filter(opening => {
                if (!opening.available_types || opening.available_types.length === 0) {
                    return false;
                }
                return opening.available_types.some(type => type.toLowerCase() === currentTypeSlug);
            });

            // Create opening grid
            let openingGridHtml = '<div class="card-grid opening-grid">';
            availableOpenings.forEach(opening => {
                const imageUrl = opening.image && opening.image.url ? opening.image.url : '';
                const slug = opening.slug || '';
                const name = opening.name || '';

                openingGridHtml += `
                    <div class="image-card" data-opening="${slug}">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : ''}
                        <h3 class="opening-card-title">${name}</h3>
                    </div>
                `;
            });
            openingGridHtml += '</div>';

            // Add back button
            openingGridHtml += '<div class="form-navigation" style="margin-top: 20px;"><button type="button" class="btn btn-secondary opening-back-btn">Back to Styles</button></div>';

            // Insert opening grid after heading
            $('.form-step[data-step="2"] h2').after(openingGridHtml);

            // Handle opening selection
            $('.opening-grid .image-card').on('click', function() {
                const opening = $(this).data('opening');
                const openingName = $(this).find('h3').text();
                const openingImage = $(this).find('img').attr('src');

                // Clear downstream selections if opening changed
                if (self.currentItem.opening !== opening) {
                    self.clearDownstreamSelections('opening');
                }

                self.currentItem.opening = opening;
                self.currentItem.openingName = openingName;
                self.currentItem.openingImage = openingImage;

                self.selectCard($(this));

                // Navigate to configuration after brief delay
                setTimeout(function() {
                    self.navigateToStep(3);
                    self.updateConfigurationPreview();
                }, 300);
            });

            // Handle back button
            $('.opening-back-btn').on('click', function() {
                self.hideOpeningSelection();
            });
        },

        hideOpeningSelection: function() {
            // Remove opening grid
            $('.opening-grid').remove();
            $('.opening-back-btn').parent().remove();

            // Show style grid again
            $('.style-grid').show();
            $('.form-step[data-step="2"] h2').text('Select Configuration Style');

            // Clear opening selection
            delete this.currentItem.opening;
            delete this.currentItem.openingName;
            delete this.currentItem.openingImage;
        },

        resetForm: function() {
            this.currentItem = {};
            this.editingItemId = null;
            this.resetConfigurationForm();
            $('.image-card').removeClass('selected');
            $('#customer-title').val('');
            $('#customer-name').val('');
            $('#customer-email').val('');
            $('#customer-alt-email').val('');
            $('#customer-phone').val('');
            $('#customer-alt-phone').val('');
            $('#customer-house-number').val('');
            $('#customer-street').val('');
            $('#customer-town').val('');
            $('#customer-county').val('');
            $('#customer-postcode').val('');
            $('#customer-directions').val('');
            $('#additional-notes').val('');
            $('input[name="availability[]"]').prop('checked', false);
            this.navigateToStep(1);
            this.navigateToSubStep('1a');
        }
    };

    // Initialize the form
    QuotationForm.init();
});
