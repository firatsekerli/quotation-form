<?php
/**
 * Quotation Form Template
 * Used by the [quotation_form] shortcode
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

$plugin_url = QUOTATION_FORM_PLUGIN_URL;

// Get ACF data
$categories = function_exists('get_field') ? get_field('product_categories', 'option') : array();
$product_types = function_exists('get_field') ? get_field('product_types', 'option') : array();
$materials = function_exists('get_field') ? get_field('materials', 'option') : array();
$styles = function_exists('get_field') ? get_field('styles', 'option') : array();
$cill_options = function_exists('get_field') ? get_field('cill_options', 'option') : array();
$patterns_library = function_exists('get_field') ? get_field('patterns', 'option') : array();
$glazing_types_raw = function_exists('get_field') ? get_field('glazing_types', 'option') : array();
$glazing_features = function_exists('get_field') ? get_field('glazing_features', 'option') : array();
$hardware_colours = function_exists('get_field') ? get_field('hardware_colours', 'option') : array();

// Process glazing types to map pattern values to full pattern data
$plugin_instance = Quotation_Form_Plugin::get_instance();
$glazing_types = method_exists($plugin_instance, 'process_glazing_types_with_patterns')
    ? $plugin_instance->process_glazing_types_with_patterns($glazing_types_raw, $patterns_library)
    : $glazing_types_raw;

// Group product types by category
$window_types = array();
$door_types = array();
$bay_types = array();

if (!empty($product_types) && is_array($product_types)) {
    foreach ($product_types as $type) {
        // Skip types turned off in settings (missing value = on, backward compatible)
        $enabled = isset($type['enabled']) ? $type['enabled'] : 1;
        if ($enabled === 0 || $enabled === '0' || $enabled === false) {
            continue;
        }
        $category = isset($type['category']) ? $type['category'] : 'windows';
        if ($category === 'windows') {
            $window_types[] = $type;
        } elseif ($category === 'doors') {
            $door_types[] = $type;
        } elseif ($category === 'bay-windows') {
            $bay_types[] = $type;
        }
    }
}

// Materials are now unified - no grouping needed

// Fallback to hardcoded if ACF data empty
$use_acf = !empty($categories);

// Hardcoded fallbacks
if (!$use_acf) {
    $categories = array(
        array('name' => 'Windows', 'slug' => 'windows', 'image' => array('url' => $plugin_url . 'assets/images/windows.jpg')),
        array('name' => 'Doors', 'slug' => 'doors', 'image' => array('url' => $plugin_url . 'assets/images/doors.jpg')),
        array('name' => 'Bay Windows', 'slug' => 'bay-windows', 'image' => array('url' => $plugin_url . 'assets/images/bay-windows.jpg')),
    );

    $window_types = array(
        array('name' => 'Casement Windows', 'slug' => 'casement', 'requires_material' => true, 'material_type' => 'standard', 'image' => array('url' => $plugin_url . 'assets/images/casement-windows.jpg')),
        array('name' => 'Flush Windows', 'slug' => 'flush', 'requires_material' => true, 'material_type' => 'standard', 'image' => array('url' => $plugin_url . 'assets/images/flush-windows.jpg')),
        array('name' => 'Tilt & Turn', 'slug' => 'tilt-turn', 'requires_material' => true, 'material_type' => 'standard', 'image' => array('url' => $plugin_url . 'assets/images/tilt-turn.jpg')),
        array('name' => 'Reversible Window', 'slug' => 'reversible', 'requires_material' => false, 'image' => array('url' => $plugin_url . 'assets/images/reversible.jpg')),
        array('name' => 'Sash Windows', 'slug' => 'sash', 'requires_material' => false, 'image' => array('url' => $plugin_url . 'assets/images/sash-windows.jpg')),
    );

    $door_types = array(
        array('name' => 'BiFold Doors', 'slug' => 'bifold', 'requires_material' => false, 'image' => array('url' => $plugin_url . 'assets/images/bifold-doors.jpg')),
        array('name' => 'French Doors', 'slug' => 'french', 'requires_material' => true, 'material_type' => 'standard', 'image' => array('url' => $plugin_url . 'assets/images/french-doors.jpg')),
        array('name' => 'Glazed Doors', 'slug' => 'glazed', 'requires_material' => true, 'material_type' => 'standard', 'image' => array('url' => $plugin_url . 'assets/images/glazed-doors.jpg')),
        array('name' => 'Sliding Doors', 'slug' => 'sliding', 'requires_material' => true, 'material_type' => 'standard', 'image' => array('url' => $plugin_url . 'assets/images/sliding-doors.jpg')),
        array('name' => 'DoorCo', 'slug' => 'doorco', 'requires_material' => true, 'material_type' => 'doorco', 'image' => array('url' => $plugin_url . 'assets/images/doorco.jpg')),
    );

    $bay_types = array(
        array('name' => 'Casement Bays', 'slug' => 'casement-bays', 'requires_material' => true, 'material_type' => 'standard', 'image' => array('url' => $plugin_url . 'assets/images/casement-bays.jpg')),
        array('name' => 'Flush Bays', 'slug' => 'flush-bays', 'requires_material' => false, 'image' => array('url' => $plugin_url . 'assets/images/flush-bays.jpg')),
        array('name' => 'Aluminium Casement Bays', 'slug' => 'aluminium-casement-bays', 'requires_material' => false, 'image' => array('url' => $plugin_url . 'assets/images/aluminium-casement-bays.jpg')),
    );

    $materials = array(
        array('name' => 'PVCu Chamfered', 'slug' => 'pvcu-chamfered', 'image' => array('url' => $plugin_url . 'assets/images/pvcu-chamfered.jpg')),
        array('name' => 'PVCu Decorative', 'slug' => 'pvcu-decorative', 'image' => array('url' => $plugin_url . 'assets/images/pvcu-decorative.jpg')),
        array('name' => 'Aluminium', 'slug' => 'aluminium', 'image' => array('url' => $plugin_url . 'assets/images/aluminium.jpg')),
        array('name' => 'Traditional', 'slug' => 'traditional', 'image' => array('url' => $plugin_url . 'assets/images/doorco-traditional.jpg')),
        array('name' => 'Designer', 'slug' => 'designer', 'image' => array('url' => $plugin_url . 'assets/images/doorco-designer.jpg')),
        array('name' => 'Contemporary', 'slug' => 'contemporary', 'image' => array('url' => $plugin_url . 'assets/images/doorco-contemporary.jpg')),
    );

    $styles = array();
    for ($i = 1; $i <= 12; $i++) {
        $styles[] = array('name' => 'Style W' . $i, 'slug' => 'w' . $i, 'image' => array('url' => $plugin_url . 'assets/images/styles/w' . $i . '.jpg'));
    }
}
?>

<div class="quotation-form-container">

    <!-- Progress Indicator -->
    <div class="progress-indicator">
        <div class="progress-step" data-step="1">
            <span class="step-number">1</span>
            <span class="step-title">Product</span>
        </div>
        <div class="progress-step" data-step="2">
            <span class="step-number">2</span>
            <span class="step-title">Style</span>
        </div>
        <div class="progress-step" data-step="3">
            <span class="step-number">3</span>
            <span class="step-title">Configuration</span>
        </div>
        <div class="progress-step clickable active" data-step="basket">
            <span class="step-number">
                <span class="basket-counter">0</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
            </span>
            <span class="step-title">Basket</span>
        </div>
        <div class="progress-step" data-step="4">
            <span class="step-number">4</span>
            <span class="step-title">Review</span>
        </div>
    </div>

    <!-- Multi-Step Form -->
    <form id="quotation-form" class="multi-step-form">

        <!-- STEP 1: PRODUCT -->
        <div class="form-step" data-step="1">

            <!-- Sub-Step 1A: Product Category -->
            <div class="sub-step active" data-substep="1a">
                <h2 class="quotation-heading">Select Category</h2>
                <div class="card-grid category-grid">
                    <?php foreach ($categories as $category):
                        $image_url = isset($category['image']['url']) ? $category['image']['url'] : '';
                        $name = isset($category['name']) ? $category['name'] : '';
                        $slug = isset($category['slug']) ? $category['slug'] : '';
                    ?>
                    <div class="image-card" data-category="<?php echo esc_attr($slug); ?>">
                        <div class="card-image">
                            <?php if ($image_url): ?>
                                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($name); ?>" loading="lazy">
                            <?php endif; ?>
                        </div>
                        <h3 class="quotation-subheading"><?php echo esc_html($name); ?></h3>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Sub-Step 1B: Windows Type Selection -->
            <div class="sub-step" data-substep="1b-windows" data-parent-category="windows">
                <h2 class="quotation-heading">Select Type</h2>
                <div class="card-grid type-grid">
                    <?php foreach ($window_types as $type):
                        $image_url = isset($type['image']['url']) ? $type['image']['url'] : '';
                        $name = isset($type['name']) ? $type['name'] : '';
                        $slug = isset($type['slug']) ? $type['slug'] : '';
                    ?>
                    <div class="image-card" data-type="<?php echo esc_attr($slug); ?>">
                        <div class="card-image">
                            <?php if ($image_url): ?>
                                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($name); ?>" loading="lazy">
                            <?php endif; ?>
                        </div>
                        <h3 class="quotation-subheading"><?php echo esc_html($name); ?></h3>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Sub-Step 1B: Doors Type Selection -->
            <div class="sub-step" data-substep="1b-doors" data-parent-category="doors">
                <h2 class="quotation-heading">Select Type</h2>
                <div class="card-grid type-grid">
                    <?php foreach ($door_types as $type):
                        $image_url = isset($type['image']['url']) ? $type['image']['url'] : '';
                        $name = isset($type['name']) ? $type['name'] : '';
                        $slug = isset($type['slug']) ? $type['slug'] : '';
                    ?>
                    <div class="image-card" data-type="<?php echo esc_attr($slug); ?>">
                        <div class="card-image">
                            <?php if ($image_url): ?>
                                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($name); ?>" loading="lazy">
                            <?php endif; ?>
                        </div>
                        <h3 class="quotation-subheading"><?php echo esc_html($name); ?></h3>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Sub-Step 1B: Bay Windows Type Selection -->
            <div class="sub-step" data-substep="1b-bay-windows" data-parent-category="bay-windows">
                <h2 class="quotation-heading">Select Type</h2>
                <div class="card-grid type-grid">
                    <?php foreach ($bay_types as $type):
                        $image_url = isset($type['image']['url']) ? $type['image']['url'] : '';
                        $name = isset($type['name']) ? $type['name'] : '';
                        $slug = isset($type['slug']) ? $type['slug'] : '';
                    ?>
                    <div class="image-card" data-type="<?php echo esc_attr($slug); ?>">
                        <div class="card-image">
                            <?php if ($image_url): ?>
                                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($name); ?>" loading="lazy">
                            <?php endif; ?>
                        </div>
                        <h3 class="quotation-subheading"><?php echo esc_html($name); ?></h3>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Sub-Step 1C: Material Selection -->
            <div class="sub-step" data-substep="1c-material">
                <h2 class="quotation-heading">Select Material</h2>
                <div class="card-grid material-grid">
                    <?php foreach ($materials as $material):
                        $image_url = isset($material['image']['url']) ? $material['image']['url'] : '';
                        $name = isset($material['name']) ? $material['name'] : '';
                        $slug = isset($material['slug']) ? $material['slug'] : '';

                        // Get availability data (array of type slugs)
                        $available_types = isset($material['available_types']) ? $material['available_types'] : array();
                    ?>
                    <div class="image-card"
                         data-material="<?php echo esc_attr($slug); ?>"
                         data-available-types="<?php echo esc_attr(json_encode($available_types)); ?>">
                        <div class="card-image">
                            <?php if ($image_url): ?>
                                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($name); ?>" loading="lazy">
                            <?php endif; ?>
                        </div>
                        <h3 class="quotation-subheading"><?php echo esc_html($name); ?></h3>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>

        </div>

        <!-- STEP 2: STYLE -->
        <div class="form-step" data-step="2">
            <h2 class="quotation-heading">Select Configuration Style</h2>
            <div class="card-grid style-grid">
                <?php
                if (!empty($styles)) {
                    foreach ($styles as $style):
                        $image_url = isset($style['image']['url']) ? $style['image']['url'] : '';
                        $slug = isset($style['slug']) ? $style['slug'] : '';
                        $name = isset($style['name']) ? $style['name'] : '';

                        // Get availability data (array of type and material slugs)
                        $available_types = isset($style['available_types']) ? $style['available_types'] : array();
                        $available_materials = isset($style['available_materials']) ? $style['available_materials'] : array();

                        // Styles that should hide Glazing Type and Glazing Features
                        // Check if slug matches or contains any of these style numbers
                        $hide_glazing_styles = array('5001', '5004', '5015', '5025', '5030', '5033', '5401');
                        $hide_glazing = '0';
                        foreach ($hide_glazing_styles as $style_num) {
                            if ($slug === $style_num || strpos($slug, $style_num) !== false) {
                                $hide_glazing = '1';
                                break;
                            }
                        }

                        // Styles that should show Infill Panel option (Glazed Doors and French Doors with midrails)
                        $show_infill_panel_styles = array('1803', '1804', '1811', '1812', '1813', '1814', '1815', '1816', '1827', '1828', '1829', '1830', '1831', '1832', '2101', '2104', '2105', '2202', '2205', '2206');
                        $show_infill_panel = '0';
                        foreach ($show_infill_panel_styles as $style_num) {
                            if ($slug === $style_num || strpos($slug, $style_num) !== false) {
                                $show_infill_panel = '1';
                                break;
                            }
                        }
                    ?>
                    <div class="image-card style-card"
                         data-style="<?php echo esc_attr($slug); ?>"
                         data-available-types="<?php echo esc_attr(json_encode($available_types)); ?>"
                         data-available-materials="<?php echo esc_attr(json_encode($available_materials)); ?>"
                         data-hide-glazing="<?php echo esc_attr($hide_glazing); ?>"
                         data-show-infill-panel="<?php echo esc_attr($show_infill_panel); ?>">
                        <div class="card-image">
                            <?php if ($image_url): ?>
                                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($name); ?>" loading="lazy">
                            <?php endif; ?>
                        </div>
                        <h3 class="quotation-subheading"><?php echo esc_html($name); ?></h3>
                    </div>
                    <?php
                    endforeach;
                } else {
                    // Fallback to W1-W12 if no styles defined
                    for ($i = 1; $i <= 12; $i++): ?>
                    <div class="image-card style-card" data-style="w<?php echo $i; ?>">
                        <div class="card-image">
                            <img src="<?php echo $plugin_url; ?>assets/images/styles/w<?php echo $i; ?>.jpg" alt="Style W<?php echo $i; ?>" loading="lazy">
                        </div>
                        <h3 class="quotation-subheading">Style W<?php echo $i; ?></h3>
                    </div>
                    <?php endfor;
                }
                ?>
            </div>
        </div>

        <!-- STEP 3: CONFIGURATION -->
        <div class="form-step" data-step="3">
            <div class="configuration-container">

                <!-- Left Side: Visual Preview -->
                <div class="configuration-preview">
                    <h3 class="quotation-subheading">Preview</h3>
                    <div class="preview-image">
                        <img id="style-preview" src="" alt="Selected Style" loading="lazy">
                    </div>
                    <div class="preview-details">
                        <p><strong>Category:</strong> <span id="preview-category"></span></p>
                        <p><strong>Type:</strong> <span id="preview-type"></span></p>
                        <p><strong>Material:</strong> <span id="preview-material"></span></p>
                        <p><strong>Style:</strong> <span id="preview-style"></span></p>
                        <p id="preview-opening-row" style="display: none;"><strong>Opening:</strong> <span id="preview-opening"></span></p>
                    </div>
                </div>

                <!-- Right Side: Configuration Form -->
                <div class="configuration-form">
                    <h2 class="quotation-heading">Configure Your Product</h2>

                    <div class="form-group">
                        <label for="width">Width (mm)</label>
                        <input type="number" id="width" name="width" min="<?php echo esc_attr($min_width); ?>" max="<?php echo esc_attr($max_width); ?>">
                        <span class="field-hint">Min: <?php echo esc_html($min_width); ?>mm - Max: <?php echo esc_html($max_width); ?>mm</span>
                    </div>

                    <!-- Segment Widths (only shown for Bay Windows with sided styles) -->
                    <div id="segment-widths-group" class="form-group" style="display: none;">
                        <label>Segment Widths (mm)</label>
                        <div id="segment-widths-inputs"></div>
                    </div>

                    <div class="form-group">
                        <label for="height">Height (mm)</label>
                        <input type="number" id="height" name="height" min="<?php echo esc_attr($min_height); ?>" max="<?php echo esc_attr($max_height); ?>">
                        <span class="field-hint">Min: <?php echo esc_html($min_height); ?>mm - Max: <?php echo esc_html($max_height); ?>mm</span>
                    </div>

                    <div class="form-group">
                        <label for="cill">External Sub Cill</label>
                        <select id="cill" name="cill">
                            <option value="">Select External Sub Cill</option>
                            <?php
                            if (!empty($cill_options) && is_array($cill_options)) {
                                foreach ($cill_options as $option) {
                                    $label = isset($option['label']) ? $option['label'] : '';
                                    $value = isset($option['value']) ? $option['value'] : '';
                                    if ($label && $value) {
                                        echo '<option value="' . esc_attr($value) . '">' . esc_html($label) . '</option>';
                                    }
                                }
                            } else {
                                // Fallback hardcoded options
                                echo '<option value="85mm">85 mm</option>';
                                echo '<option value="150mm">150 mm</option>';
                                echo '<option value="180mm">180 mm</option>';
                            }
                            ?>
                        </select>
                    </div>

                    <!-- Number of Side Panels (only shown for Composite Doors) -->
                    <div class="form-group side-panels-selection" style="display: none;">
                        <label for="side-panels">Number of Side Panels</label>
                        <select id="side-panels" name="side_panels">
                            <option value="">Select Number of Side Panels</option>
                            <option value="Not Required">Not Required</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                        </select>
                    </div>

                    <!-- Aluminium Colour Type Selection (only shown when aluminium material selected) -->
                    <div class="form-group aluminium-colour-type-selection" style="display: none;">
                        <label>Select Colour Type</label>
                        <div class="aluminium-type-grid">
                            <div class="aluminium-type-card" data-aluminium-type="stock">
                                <h4>Aluminium Stock Colours</h4>
                                <p>Choose from 4 standard colours</p>
                            </div>
                            <div class="aluminium-type-card" data-aluminium-type="special">
                                <h4>Aluminium Special Colours</h4>
                                <p>Choose custom external and internal colours</p>
                            </div>
                        </div>
                        <input type="hidden" id="aluminium-colour-type" name="aluminium_colour_type">
                    </div>

                    <div class="form-group">
                        <label>Section Colour</label>

                        <div class="colour-selection">
                            <h4 class="colour-section-label outside-colour-label">Outside Colour</h4>
                            <div class="colour-picker-container">
                                <input type="text" id="outside-colour-search" placeholder="Search colours...">
                                <div class="colour-grid" id="outside-colour-grid">
                                    <!-- Colours will be populated by JavaScript -->
                                </div>
                                <input type="hidden" id="outside-colour" name="outside_colour">
                                <input type="hidden" id="outside-finish-type" name="outside_finish_type">
                                <p class="colour-selection-display">You have chosen: <strong id="outside-colour-name">None</strong></p>
                            </div>
                        </div>

                        <div class="colour-selection">
                            <h4 class="colour-section-label inside-colour-label">Inside Colour</h4>
                            <div class="colour-picker-container">
                                <input type="text" id="inside-colour-search" placeholder="Search colours...">
                                <div class="colour-grid" id="inside-colour-grid">
                                    <!-- Colours will be populated by JavaScript -->
                                </div>
                                <input type="hidden" id="inside-colour" name="inside_colour">
                                <input type="hidden" id="inside-finish-type" name="inside_finish_type">
                                <p class="colour-selection-display">You have chosen: <strong id="inside-colour-name">None</strong></p>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Glazing Type</label>
                        <div class="glazing-type-selection">
                            <div class="glazing-type-grid" id="glazing-type-grid">
                                <?php
                                if (!empty($glazing_types) && is_array($glazing_types)) {
                                    foreach ($glazing_types as $type) {
                                        $label = isset($type['label']) ? $type['label'] : '';
                                        $value = isset($type['value']) ? $type['value'] : '';
                                        $icon = isset($type['icon']) ? $type['icon'] : '';
                                        $patterns = isset($type['patterns']) ? $type['patterns'] : array();

                                        if ($label && $value) {
                                            ?>
                                            <div class="glazing-type-card" data-glazing-type="<?php echo esc_attr($value); ?>" data-patterns='<?php echo esc_attr(json_encode($patterns)); ?>'>
                                                <div class="glazing-type-icon">
                                                    <?php if (!empty($icon)): ?>
                                                        <img src="<?php echo esc_url($icon); ?>" alt="<?php echo esc_attr($label); ?>" loading="lazy">
                                                    <?php endif; ?>
                                                </div>
                                                <div class="glazing-type-label"><?php echo esc_html($label); ?></div>
                                            </div>
                                            <?php
                                        }
                                    }
                                } else {
                                    // Fallback hardcoded options
                                    $fallback_types = array(
                                        array('label' => 'Low E (Double)', 'value' => 'low-e-double', 'color' => '#7CB342'),
                                        array('label' => 'Low E (Triple)', 'value' => 'low-e-triple', 'color' => '#7CB342'),
                                        array('label' => 'High Security', 'value' => 'high-security', 'color' => '#2196F3'),
                                        array('label' => 'Acoustic Glazing', 'value' => 'acoustic', 'color' => '#E53935'),
                                        array('label' => 'Self Cleaning', 'value' => 'self-cleaning', 'color' => '#00BCD4'),
                                    );
                                    foreach ($fallback_types as $type) {
                                        ?>
                                        <div class="glazing-type-card" data-glazing-type="<?php echo esc_attr($type['value']); ?>" data-patterns="[]">
                                            <div class="glazing-type-icon" style="background-color: <?php echo esc_attr($type['color']); ?>;"></div>
                                            <div class="glazing-type-label"><?php echo esc_html($type['label']); ?></div>
                                        </div>
                                        <?php
                                    }
                                }
                                ?>
                            </div>
                            <input type="hidden" id="glazing-type" name="glazing_type">
                            <p class="glazing-type-selection-display">You have chosen: <strong id="glazing-type-name">None</strong></p>

                            <div id="glazing-pattern-group" style="display: none;">
                                <label>Select a Pattern</label>
                                <div class="glazing-pattern-selection">
                                    <div class="glazing-pattern-grid" id="glazing-pattern-grid">
                                        <!-- Patterns will be populated by JavaScript based on selected type -->
                                    </div>
                                    <input type="hidden" id="glazing-pattern" name="glazing_pattern">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="glazing-features">Glazing Features</label>
                        <div class="glazing-features-selection">
                            <div class="glazing-features-picker-container">
                                <input type="text" id="glazing-features-search" placeholder="Search glazing features...">
                                <div class="glazing-features-grid" id="glazing-features-grid">
                                    <!-- Glazing features will be populated by JavaScript -->
                                </div>
                                <input type="hidden" id="glazing-features" name="glazing_features">
                                <p class="glazing-features-selection-display">Selected: <strong id="glazing-features-name">Not Required</strong></p>
                            </div>
                        </div>
                    </div>

                    <!-- Infill Panel (only shown for Glazed Doors with midrail styles) -->
                    <div class="form-group infill-panel-selection" style="display: none;">
                        <label for="infill-panel">Infill Panel</label>
                        <select id="infill-panel" name="infill_panel">
                            <option value="">Select Infill Panel</option>
                            <option value="Not Required">Not Required</option>
                            <option value="Yes">Yes</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Hardware Colour</label>
                        <div class="hardware-colour-selection">
                            <div class="hardware-colour-grid" id="hardware-colour-grid">
                                <!-- Hardware colours will be populated by JavaScript -->
                            </div>
                            <input type="hidden" id="hardware-colour" name="hardware_colour">
                            <p class="colour-selection-display">You have chosen: <strong id="hardware-colour-name">None</strong></p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="frame-images">Attach Image <span id="image-optional-text">(Optional)</span></label>
                        <p class="field-description">Image upload is optional and not required but it will help us to see your property to help us understand your windows, doors, or other requirements.</p>
                        <input type="file" id="frame-images" name="frame_images" accept="image/*">
                        <span class="field-hint">Upload 1 image (max 1MB)</span>
                        <div id="file-preview" class="file-preview"></div>
                    </div>

                    <div class="configuration-actions">
                        <button type="button" class="btn btn-secondary" id="restart-btn">Restart</button>
                        <button type="button" class="btn btn-primary" id="add-to-basket-btn">Add to Basket</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- BASKET REVIEW -->
        <div class="form-step basket-review active" data-step="basket">
            <div class="basket-header">
                <h2 class="quotation-heading">Your Basket</h2>
                <a href="<?php echo esc_url(home_url('/')); ?>" class="btn btn-secondary btn-home" target="_blank">Home</a>
            </div>
            <p class="basket-count">Your basket contains <strong id="basket-item-count">0</strong> item(s)</p>

            <div id="basket-items-container">
                <!-- Basket items will be populated by JavaScript -->
            </div>

            <div class="basket-actions">
                <button type="button" class="btn btn-secondary" id="add-more-items-btn">Add Item</button>
                <button type="button" class="btn btn-primary" id="proceed-to-review-btn">Next</button>
            </div>
        </div>

        <!-- STEP 4: REVIEW & SUBMISSION -->
        <div class="form-step" data-step="4">
            <h2 class="quotation-heading">Contact Information</h2>

            <div class="review-container">
                <div class="customer-details-form">
                    <div class="form-group">
                        <label for="customer-title">Title *</label>
                        <select id="customer-title" name="customer_title" required>
                            <option value="" disabled selected>Select Title</option>
                            <option value="Mr.">Mr.</option>
                            <option value="Ms.">Ms.</option>
                            <option value="Mrs.">Mrs.</option>
                            <option value="Miss">Miss</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="customer-name">Full Name *</label>
                        <input type="text" id="customer-name" name="customer_name" required>
                    </div>

                    <div class="form-group">
                        <label for="customer-email">Email *</label>
                        <input type="email" id="customer-email" name="customer_email" required>
                    </div>

                    <div class="form-group">
                        <label for="customer-phone">Phone Number *</label>
                        <input type="tel" id="customer-phone" name="customer_phone" required>
                    </div>

                    <div class="form-group">
                        <label for="customer-alt-email">Alternative Email *</label>
                        <input type="email" id="customer-alt-email" name="customer_alt_email" required>
                    </div>

                    <div class="form-group">
                        <label for="customer-alt-phone">Alternative Phone Number *</label>
                        <input type="tel" id="customer-alt-phone" name="customer_alt_phone" required>
                    </div>

                    <div class="form-group">
                        <label for="customer-house-number">House Name or Number *</label>
                        <input type="text" id="customer-house-number" name="customer_house_number" required>
                    </div>

                    <div class="form-group">
                        <label for="customer-street">Street *</label>
                        <input type="text" id="customer-street" name="customer_street" required>
                    </div>

                    <div class="form-group">
                        <label for="customer-town">Town *</label>
                        <input type="text" id="customer-town" name="customer_town" required>
                    </div>

                    <div class="form-group">
                        <label for="customer-county">County *</label>
                        <input type="text" id="customer-county" name="customer_county" required>
                    </div>

                    <div class="form-group">
                        <label for="customer-postcode">Postcode *</label>
                        <input type="text" id="customer-postcode" name="customer_postcode" required>
                    </div>

                    <div class="form-group">
                        <label for="preferred-contact">Preferred Contact Method</label>
                        <select id="preferred-contact" name="preferred_contact">
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="either">Either</option>
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label for="customer-directions">Directions or nearby landmarks *</label>
                        <textarea id="customer-directions" name="customer_directions" rows="3" required></textarea>
                    </div>

                    <div class="form-group full-width availability-group">
                        <label>When is someone usually at home? *</label>
                        <p class="availability-subtext">Tick the days and times someone is home so we can arrange a call or carry out the work.</p>
                        <div class="availability-grid">
                            <?php
                            $availability_days = array('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday');
                            foreach ($availability_days as $day) :
                                foreach (array('AM', 'PM') as $slot) :
                                    $slot_label = $day . ' ' . $slot;
                            ?>
                                <label class="checkbox-label availability-option">
                                    <input type="checkbox" name="availability[]" value="<?php echo esc_attr($slot_label); ?>">
                                    <span><?php echo esc_html($slot_label); ?></span>
                                </label>
                            <?php
                                endforeach;
                            endforeach;
                            ?>
                        </div>
                        <p class="availability-note"><strong>Please note:</strong> We will do our best to visit during your preferred AM or PM slot, but because of the nature of our work and travel between jobs we are unable to guarantee or commit to specific times. We do not offer same day call outs. We aim to respond to all requests within 7 working days of receiving your form.</p>
                    </div>

                    <div class="form-group full-width">
                        <label for="additional-notes">Additional Notes</label>
                        <textarea id="additional-notes" name="additional_notes" rows="4" placeholder="Any special requirements or questions?"></textarea>
                    </div>

                    <!-- Attribution tracking fields -->
                    <input type="hidden" id="utm_source" name="utm_source">
                    <input type="hidden" id="utm_medium" name="utm_medium">
                    <input type="hidden" id="utm_campaign" name="utm_campaign">
                    <input type="hidden" id="utm_content" name="utm_content">
                    <input type="hidden" id="fbclid" name="fbclid">
                    <input type="hidden" id="landing_url" name="landing_url">
                    <input type="hidden" id="referrer" name="referrer">
                </div>

                <div class="order-summary">
                    <h3 class="quotation-subheading">Order Summary</h3>
                    <div id="final-basket-summary">
                        <!-- Will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>

        <p id="submit-disclaimer" style="display: none; text-align: center; color: #666; font-size: 14px; margin-bottom: 10px;">Initial quotations are given in good faith based on our interpretations of information submitted.</p>

        <!-- Navigation Buttons -->
        <div class="form-navigation">
            <button type="button" class="btn btn-secondary" id="prev-btn" style="display: none;">Back</button>
            <button type="button" class="btn btn-primary" id="next-btn" style="display: none;">Next</button>
            <button type="submit" class="btn btn-primary" id="submit-btn" style="display: none;">Submit Quote Request</button>
        </div>

    </form>

    <!-- Edit Item Modal -->
    <div id="edit-item-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3 class="quotation-subheading">Edit Item</h3>
            <div id="edit-item-content">
                <!-- Will be populated dynamically -->
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
                <button type="button" class="btn btn-primary modal-apply">Apply Changes</button>
            </div>
        </div>
    </div>

</div>
